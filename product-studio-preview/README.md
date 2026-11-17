# Product Studio preview

This directory contains the standalone, static Product Studio prototype. Open `index.html` in a browser to try it.

It lets a person choose a book, Slicz shirt, or affiliate-product starting template; edit offer text and a seller checkout URL; preview the page; save values in that browser's local storage; copy text; and download an HTML draft.

It is separate from the existing Xspresso application and does not run on the live host. The product templates are examples, not integrations. There is no account storage, hosted landing-page publishing, live checkout, ad publishing, affiliate tracking, or payout processing in this prototype.

The private preview remains at https://xspresso-product-studio-preview-2026.leanfawn1.chatgpt.site. It has a separate deployment repository; this branch is the copy in `office222/xspresso-clean` for future integration work.

## Hosted-page API on this branch

`CODE/xspresso_landing_pages_v1.js` is connected to `CODE/xspresso_runtime_server_v2.js` on this branch. It adds tenant-owned drafts and public rendering at `/p/:slug` without changing the live host or the standalone preview UI. The API uses the runtime's existing bearer authentication and JSON store. The JSON store is suitable only for the existing single-process MVP; use a transactional database before multi-process production or substantial customer traffic.

- `GET /api/landing-pages` lists only the signed-in tenant's pages.
- `POST /api/landing-pages` saves a draft.
- `GET /api/landing-pages/:id` retrieves a tenant-owned page.
- `PATCH /api/landing-pages/:id` edits and returns the page to draft; a published URL stops serving until republished.
- `POST /api/landing-pages/:id/publish` with `{"slug":"craigs-book"}` publishes at `/p/craigs-book`. Slugs are globally unique among published pages.
- `POST /api/landing-pages/:id/unpublish` with `{}` unpublishes it.

Create and edit require the full offer shape: `name`, `seller`, `headline`, `description`, `cta`, `price` (optional empty string), `checkoutUrl`, `refundUrl` (optional empty string), and boolean `disclose`. Checkout is seller-directed. The handler escapes content, validates links, sets a restrictive Content Security Policy, and does not expose tenant IDs in responses.

Run the focused tests from `CODE/`: `node --test xspresso_landing_pages_v1.test.mjs`. The tests cover tenant separation, drafts, publishing, unpublishing, slug conflicts, and unsafe input.

## Remaining work

The standalone preview still uses browser-local storage and HTML download; it is not wired to the hosted-page API. Add an authenticated page management UI and preview/publish controls, then test the full existing runtime and reconcile with the actual Namecheap deployment before considering a live install. HTML download stays optional. This branch does not integrate with the existing campaign or ad approval modules.
