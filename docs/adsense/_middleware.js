// Cloudflare Pages Function: strict, nonce-based Content Security Policy for Google AdSense.
//
// NOT ACTIVE. On launch day copy this file to  functions/_middleware.js  (at the repo root,
// next to static/), then remove the "Content-Security-Policy" line under "/*" in static/_headers.
// See docs/ADSENSE.md, step 6.
//
// Why: AdSense only supports a strict CSP that uses a fresh random nonce on every <script>
// (its ad domains change over time, so a fixed allowlist breaks ads). A static site can't
// create a nonce per request, so this function adds one to each HTML response:
//   1. generates a random nonce,
//   2. adds nonce="..." to every <script> tag in the page (AdSense, our own scripts, JSON-LD),
//   3. sends Google's recommended strict policy with that nonce.
// Non-HTML files (CSS, JS, images, fonts) pass through untouched.

const POLICY = (nonce) => [
  "object-src 'none'",
  // Modern browsers use the nonce + strict-dynamic; the other values are fallbacks for old browsers.
  `script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:`,
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function makeNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export async function onRequest(context) {
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  const nonce = makeNonce();
  const rewritten = new HTMLRewriter()
    .on('script', { element(el) { el.setAttribute('nonce', nonce); } })
    .transform(response);

  const out = new Response(rewritten.body, rewritten);
  out.headers.set('Content-Security-Policy', POLICY(nonce));
  // The embeddable counter may be framed by any site; everything else only by us.
  const path = new URL(context.request.url).pathname;
  if (path === '/embed' || path === '/embed.html') {
    out.headers.delete('X-Frame-Options');
    out.headers.append('Content-Security-Policy', 'frame-ancestors *');
  } else {
    out.headers.set('X-Frame-Options', 'SAMEORIGIN');
  }
  // HTML must never be served from a shared cache with someone else's nonce.
  out.headers.set('Cache-Control', 'no-cache');
  return out;
}
