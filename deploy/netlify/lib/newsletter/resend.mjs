// A small client for the Resend REST API.
//
// fetch rather than the SDK: the project pins every dependency exactly and the
// handful of endpoints used here do not justify another one. Requests are
// paced under Resend's 10-per-second team limit and retried on a rate-limit
// 429 or a 5xx - but never on a quota 429, which waiting a second will not fix.
import { createHash } from 'node:crypto';

const API = 'https://api.resend.com';
const MIN_INTERVAL_MS = 125;

let lastRequestAt = 0;

export class ResendError extends Error {
  constructor(status, body) {
    super(`Resend ${status}: ${body?.name ?? 'error'} - ${body?.message ?? 'no message'}`);
    this.status = status;
    this.code = body?.name ?? '';
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function hasApiKey() {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Identifies the Resend account without storing the key: the first sixteen hex
 * characters of its SHA-256. A new key is treated as a new account, which is
 * the safe assumption - re-checking segments on a rotated key in the same
 * account costs a few requests, while trusting stale ids on a new account
 * would break every send.
 */
export function accountFingerprint() {
  return createHash('sha256').update(process.env.RESEND_API_KEY ?? '').digest('hex').slice(0, 16);
}

export async function resend(method, path, body, { idempotencyKey } = {}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new ResendError(0, { name: 'missing_api_key', message: 'RESEND_API_KEY is not set.' });

  for (let attempt = 0; ; attempt += 1) {
    const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();

    const headers = {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'User-Agent': 'compoundingjourney-newsletter/1.0'
    };
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    const response = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text.slice(0, 200) };
    }
    if (response.ok) return data ?? {};

    const error = new ResendError(response.status, data);
    const retryable = (response.status === 429 && !isQuotaError(error)) || response.status >= 500;
    if (!retryable || attempt >= 2) throw error;
    const retryAfter = Number(response.headers.get('retry-after'));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 3) * 1000 : 600 * (attempt + 1));
  }
}

export function isNotFound(error) {
  return error instanceof ResendError && error.status === 404;
}

export function isQuotaError(error) {
  return error instanceof ResendError && error.status === 429 && /quota/i.test(error.code);
}

/** The contact already exists - Resend has answered this as a 409 and as a 422. */
export function isConflict(error) {
  return error instanceof ResendError && (error.status === 409 || (error.status === 422 && /exist/i.test(error.message)));
}
