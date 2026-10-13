const PAGE_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store',
  'content-security-policy': "default-src 'none'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  'x-content-type-options': 'nosniff'
};

/**
 * Middleware for GET confirmation and POST confirmation at /api/unsubscribe.
 * GET is intentionally non-mutating so link scanners do not unsubscribe people.
 */
export function createUnsubscribeRoute({ unsubscribeService, tokenService, fallback, bodyLimitBytes = 4096 } = {}) {
  if (typeof unsubscribeService?.unsubscribe !== 'function' || typeof tokenService?.verify !== 'function') throw new TypeError('unsubscribeService and tokenService are required.');
  return async function unsubscribeRoute(req, res) {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname !== '/api/unsubscribe') return typeof fallback === 'function' ? fallback(req, res) : reply(res, 404, '<!doctype html><title>Not found</title><p>Not found.</p>');
    try {
      if (req.method === 'GET') {
        const token = url.searchParams.get('token') || '';
        tokenService.verify(token);
        return reply(res, 200, confirmationPage(token));
      }
      if (req.method === 'POST') {
        const form = await readForm(req, bodyLimitBytes);
        await unsubscribeService.unsubscribe(form.get('token') || '');
        return reply(res, 200, '<!doctype html><html lang="en"><meta charset="utf-8"><title>Unsubscribed</title><p>You have been unsubscribed from these follow-up messages.</p></html>');
      }
      res.setHeader?.('allow', 'GET, POST');
      return reply(res, 405, '<!doctype html><title>Method not allowed</title><p>Use the unsubscribe link provided.</p>');
    } catch (error) {
      const status = Number.isInteger(error?.status) ? error.status : 400;
      const text = status === 410 ? 'This unsubscribe link has expired. Please contact the sender for help.' : 'This unsubscribe link is invalid or could not be processed.';
      return reply(res, status, `<!doctype html><meta charset="utf-8"><title>Unsubscribe</title><p>${text}</p>`);
    }
  };
}

function confirmationPage(token) {
  // Tokens use base64url characters only; verify() has already validated the signature.
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Unsubscribe</title><h1>Unsubscribe</h1><p>Confirm that you want to stop receiving these follow-up messages.</p><form method="post" action="/api/unsubscribe"><input type="hidden" name="token" value="${token}"><button type="submit">Unsubscribe</button></form></html>`;
}
async function readForm(req, limit) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Request too large.'), { status: 413 });
    chunks.push(Buffer.from(chunk));
  }
  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}
function reply(res, status, html) {
  if (typeof res.writeHead === 'function') res.writeHead(status, PAGE_HEADERS);
  else { res.statusCode = status; for (const [key, value] of Object.entries(PAGE_HEADERS)) res.setHeader?.(key, value); }
  res.end(html);
  return true;
}
