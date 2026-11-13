# Product Studio preview

This directory contains the standalone, static Product Studio prototype. Open `index.html` in a browser to try it.

It lets a person choose a book, Slicz shirt, or affiliate-product starting template; edit offer text and a seller checkout URL; preview the page; save values in that browser's local storage; copy text; and download an HTML draft.

It is separate from the existing Xspresso application and does not run on the live host. The product templates are examples, not integrations. There is no account storage, hosted landing-page publishing, live checkout, ad publishing, affiliate tracking, or payout processing in this prototype.

The private preview remains at https://xspresso-product-studio-preview-2026.leanfawn1.chatgpt.site. It has a separate deployment repository; this branch is the copy in `office222/xspresso-clean` for future integration work.

## Planned next milestone

Keep the existing app and live host unchanged while designing account-owned landing pages and server-side drafts. The proposed public URL format is `xspresso.com/p/page-name`. Publishing, editing, and unpublishing require authenticated ownership checks, a persistent database, safe page rendering, reserved slugs, and explicit publishing controls. HTML download remains optional. Inspect the current Xspresso runtime and hosting environment before implementation. Do not assume this standalone page is integrated with the application's existing campaign or approval modules.
