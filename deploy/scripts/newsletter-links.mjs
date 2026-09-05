/**
 * The per-language newsletter URL, read out of the homepage template.
 *
 * The three URLs are declared once, in the `newsletterLinks` object inside
 * content/home/index.html, and generate-home-pages.mjs already reads them from
 * there to localise the home page's newsletter buttons. Every other generator
 * that wants to offer the newsletter reads them through here.
 *
 * A second hard-coded copy was the obvious alternative and is the thing to
 * avoid: the lists are hosted (MailerLite for Spanish and Portuguese, Substack
 * for English), so the URLs change when the provider or the form does, and a
 * stale copy sends readers to a form that no longer collects anything - which
 * looks exactly like a form that works.
 *
 * The parse is deliberately narrow. It reads `const newsletterLinks = { ... }`
 * and nothing else, and throws if the block is missing or does not yield all
 * three languages, because a build that silently drops the opt-in is worse than
 * one that stops.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LANGUAGES } from './site-routes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let cached = null;

export async function newsletterLinks() {
  if (cached) return cached;

  const template = await fs.readFile(path.join(root, 'content', 'home', 'index.html'), 'utf8');
  const block = template.match(/const newsletterLinks = \{([^}]*)\}/);
  if (!block) {
    throw new Error('Could not find "const newsletterLinks = { ... }" in content/home/index.html.');
  }

  const links = {};
  for (const [, language, url] of block[1].matchAll(/(\w+)\s*:\s*"([^"]+)"/g)) {
    links[language] = url;
  }

  const missing = LANGUAGES.filter((language) => !links[language]);
  if (missing.length > 0) {
    throw new Error(`The homepage's newsletterLinks has no URL for: ${missing.join(', ')}.`);
  }
  for (const language of LANGUAGES) {
    if (!links[language].startsWith('https://')) {
      throw new Error(`The ${language} newsletter URL is not https: ${links[language]}`);
    }
  }

  cached = links;
  return links;
}
