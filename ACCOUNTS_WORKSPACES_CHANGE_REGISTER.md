# Accounts and Private Workspaces — Change Register

## Branch and boundaries
- Branch: `feat/accounts-workspaces`
- Base: `main`
- Separate from `feat/multi-platform-ad-previews` and `feat/product-studio-preview`
- No merge or deployment is included or authorized.
- Live Xspresso is untouched.

## Existing account functionality confirmed
- Dashboard UI already contains sign-in and create-account views.
- API auth routes already support signup, login, current-user lookup, and logout.
- The account-aware runtime uses scrypt password hashes and stores only hashes of bearer session tokens.
- Each new account receives its own tenant ID.
- Campaigns, leads, settings, alerts, credits, and review resources are designed to be tenant-scoped.

## Changes in this branch
1. `CODE/package.json`
   - `npm start` now starts `xspresso_runtime_server_v2.js`, the account-aware runtime with persisted session records and auth rate limiting.
   - `npm run dev` uses the same runtime.
   - Added a focused top-level Node test command.
2. `CODE/xspresso_runtime_server_v2.test.js`
   - Added an HTTP integration test that creates two accounts, verifies distinct tenant IDs, proves one account cannot list or fetch the other's campaign, and verifies logout invalidates the session.

## Validation
- `npm test` runs the focused account/runtime suite: **11 passed, 0 failed** using Node.js 22.16.0.
- `npm run test:all` runs all top-level tests; the available inspection snapshot reported **96 passed, 9 failed**.
- A broader top-level test run on the available inspection snapshot reported **96 passed, 9 failed**. Failures include absent optional dependencies/modules and unrelated pre-existing test expectation/provider-fixture issues. Do not treat the full suite as green.
- The account isolation test passed in the focused run.
- No real hosted database, email verification, password reset, billing identity, or production deployment was tested.

## Product decision / scope
- Current model is one private tenant/workspace per registered account.
- Multi-user teams, invitations, shared workspaces, and workspace switching are not implemented by this change.
- The JSON file store is single-process MVP persistence, not a production multi-instance database.
- Frontend sign-in/registration UI already exists in `CODE/xspresso_dashboard_app_v1.js`; this branch makes the account-aware runtime the default npm entry point and verifies the isolation contract.

## Next work
- Verify deployment environment and database strategy before production use.
- Add email verification and password reset flows with a mail provider.
- If shared/team workspaces are required, add explicit membership and role records rather than weakening per-tenant isolation.
