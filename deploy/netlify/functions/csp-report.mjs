// Receives Content-Security-Policy violation reports.
//
// Every policy in _headers names this endpoint twice - once as `report-to csp`
// via the Reporting-Endpoints header, which is what Chrome implements, and once
// as the deprecated `report-uri`, which is what Firefox and Safari implement. A
// browser that understands both ignores the second, so a violation arrives here
// once regardless of which mechanism sent it.
//
// The reports go to the function log and nowhere else. That is deliberate. A
// violation is a signal that something about the site changed - a script moved
// to a CDN the policy does not list, an injected element tried to load - and the
// thing to do with it is read it while investigating, not accumulate it. Writing
// them to the database would mean an unauthenticated public endpoint that grows
// a table, which is a worse trade than losing reports older than the log
// retention.
//
// This endpoint is public and unauthenticated because it has to be: the browser
// posts the report itself, with no credentials and no way to add any. It is
// therefore not a security boundary and nothing downstream may treat a report as
// true. The guards below exist to keep it cheap and quiet rather than to keep
// anyone out - wrong method, wrong type, or an oversized body is dropped without
// being parsed, and everything else answers 204 whatever happened, because a
// browser has no use for the outcome and retries nothing.

/** The two media types a browser sends. Anything else is not a report. */
const REPORT_TYPES = new Set([
  // report-uri, sent by Firefox and Safari.
  'application/csp-report',
  // report-to, sent by Chrome. Carries a batch of reports of mixed types.
  'application/reports+json'
]);

/** Generous for a report, small enough that nothing is ever buffered at scale. */
const MAX_BYTES = 16 * 1024;

/** Only the fields worth reading later. The rest of a report is noise. */
function summarize(body) {
  return {
    directive: body?.effectiveDirective || body?.violatedDirective || 'unknown',
    blocked: body?.blockedURL || body?.blockedURI || 'unknown',
    document: body?.documentURL || body?.documentURI || 'unknown',
    // Present only when the violation was an inline block or an eval, and the
    // single most useful field when it is: it says which one.
    sample: body?.sample ? String(body.sample).slice(0, 200) : undefined
  };
}

export default async (request) => {
  // 204 rather than 405 even here. A browser posting a report ignores the status
  // either way, and answering an unexpected method with a shape that invites a
  // retry is the opposite of what this endpoint wants.
  if (request.method !== 'POST') return new Response(null, { status: 204 });

  const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!REPORT_TYPES.has(type)) return new Response(null, { status: 204 });

  const declared = Number.parseInt(request.headers.get('content-length') || '', 10);
  if (Number.isFinite(declared) && declared > MAX_BYTES) return new Response(null, { status: 204 });

  try {
    const raw = await request.text();
    // Content-Length is a claim, not a measurement. This is the check that holds.
    if (raw.length > MAX_BYTES) return new Response(null, { status: 204 });

    const payload = JSON.parse(raw);
    // report-uri sends one report under `csp-report`; report-to sends an array
    // of envelopes, each with the report under `body`, and only some of them are
    // CSP reports at all.
    const reports = Array.isArray(payload)
      ? payload.filter((entry) => entry?.type === 'csp-violation').map((entry) => entry.body)
      : [payload['csp-report']];

    for (const report of reports) {
      if (!report) continue;
      console.log('CSP violation', JSON.stringify(summarize(report)));
    }
  } catch {
    // A malformed report is not worth a log line of its own: the only thing it
    // establishes is that something posted here that was not a browser.
  }

  return new Response(null, { status: 204 });
};

export const config = {
  path: '/api/csp-report'
};
