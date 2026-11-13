# Xspresso change register — multi-platform ad preview

**Repository:** `office222/xspresso-clean`  
**Base:** `main` at `be0f3797a854b1e15a1aa38288ba91cb89c6d919`  
**Working branch:** `feat/multi-platform-ad-previews`  
**Scope:** Additive preview foundation only. No production deployment.

## Files added

| File | Purpose | Status |
|---|---|---|
| `CODE/xspresso_ad_preview_engine_v1.js` | Normalizes campaign content into platform-specific preview models | Added; tests authored |
| `CODE/xspresso_multi_platform_preview_panel_v1.js` | DOM preview cards with individual approve and save-as-draft callbacks | Added; not wired into dashboard |
| `CODE/xspresso_multi_platform_preview_v1.css` | Responsive preview card styling | Added; not wired into app shell |
| `CODE/xspresso_ad_preview_engine_v1.test.js` | Node built-in tests for platform models, status and warnings | Added; execution pending |
| `MULTI_PLATFORM_AD_PREVIEW_CHANGE_REGISTER.md` | Scope and safety record | Added |

## Current supported preview concepts

- Facebook feed
- Instagram visual-first / feed, Stories and Reels concept
- Google responsive search ad
- TikTok in-feed video concept

These are illustrative layouts, not exact network-rendered previews or guaranteed current specification validation.

## Safety and integration boundaries

- No ad network API calls.
- No ad publishing.
- No campaign budget or spend changes.
- No changes to existing API routes, dashboard files, Meta OAuth, or live hosting.
- Account connection status is supplied by the caller; absent status defaults to not connected.
- `publishAvailable` is always false in this preview foundation.
- Approval and save actions are callbacks only; persistence must be connected to the existing tenant-scoped campaign services after integration review.

## Next integration work

1. Run tests in the repository's actual Node environment.
2. Confirm the canonical dashboard entry point and load order.
3. Wire preview generation to the saved campaign draft.
4. Persist per-platform approval/draft state with tenant scoping and optimistic version checks.
5. Add platform-specific publishing adapters only after OAuth scopes, credentials, permissions, review requirements and user authorization are confirmed.
6. Update this register with test output and commit SHA.
