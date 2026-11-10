# FinWeave cloud demo

This is an isolated hosted demo of the existing FinWeave frontend. It reuses the original screens, financial domain commands, schemas, forecasts and scripted assistant through a real HTTP demo backend backed by Cloudflare D1.

- Open `/` or `/auth/login`, choose **Đăng nhập demo**, then enter **123456**.
- Each browser receives a random HttpOnly visitor cookie and a separate persisted demo workspace. Data is retained for seven days. Refreshing or signing out does not erase saved changes. **Reset demo** resets only that visitor's sample data.
- Accounts, quantities, transactions and assistant responses are examples. Market quotes for confirmed FPT/VCB/HPG (HOSE), PNJ 9999 rings/SJC bullion (TP.HCM) and BTMC Rồng Thăng Long 9999 rings/SJC bullion use live upstream snapshots. Existing unconfirmed demo assets require explicit catalogue confirmation. The local PostgreSQL runtime, real financial sources, Android notification collection and local LLM are not hosted by this demo.
- No production credentials, private databases, signing keys, environment files or AI weights are included.

## Develop and publish

Use the Sites workflow with `.openai/hosting.json`; keep its project ID. Install with the Sites `install-dependencies.mjs` helper and build with `build-site.mjs`. The build first bundles the retained SPA, then the server Worker. Original SPA source/assets are in `frontend/`; generated `public/` and `dist/` are ignored.

D1 migrations are generated from `db/schema.ts` into `drizzle/`; publishing applies the versioned migration. For local preview use the starter's `scripts/sites-env.mjs` and Wrangler with `dist/server/wrangler.json` and `.wrangler/state`. Run `node scripts/check-demo.mjs <preview-origin>` to verify HTTP login, preview/commit, idempotency, persistence, parallel reads, visitor isolation, logout/login and origin protection.

API routes: `/api/health`, `/api/demo/bootstrap`, `/api/demo/v1/identity/:operation`, `/api/demo/v1/logical/:operation`, `/api/demo/v2/operational`, `/api/demo/v1/control`.

## Market prices

Server-side adapters use SSI iBoard `/stock/{symbol}` and the HTTPS BTMC public API described at https://btmc.vn/thong-tin/tai-lieu-api/api-gia-vang-17784.html. BTMC publishes the public integration key; no visitor credentials are sent upstream. Gold uses `pb` in VND/chỉ with exact product/purity matching and provider update time. Stock uses `matchedPrice` in VND/share and the trading session date at midnight GMT+7 as a date-only anchor, clearly labelled without claiming a last-trade timestamp. Zero/missing prices are rejected.

The visible app checks every minute, pauses while dialogs are open, and offers manual refresh (available again immediately after the current request completes). Fetches time out after eight seconds, share in-flight requests and cache for sixty seconds per Worker isolate. No background update while the app is closed is claimed. Prices can be delayed by upstream; this is polling, not tick streaming. Failures, unknown profiles, wrong units and older observations retain existing prices. The cloud business clock advances on refresh so new prices are visible in the current period. The PostgreSQL runtime remains a separate synthetic-local environment.

PNJ integration uses its official public price-board endpoint `https://edge-cf-api.pnj.io/ecom-frontend/v1/get-gold-price?zone=00`. Exact products N24K / SJC, TP.HCM; `giamua` is thousands of VND/chỉ and is multiplied by 1000 exactly. Provider update time is preserved in GMT+7. PNJ and BTMC have distinct catalogue IDs: a BTMC product is never silently valued using PNJ prices. BTMC requests timed out from the production cloud during verification on 03/11/2026; PNJ is offered first. Refresh requests allow 15 seconds on the client to cover the eight-second upstream deadline and cloud latency.
