# Asset Manager Example Apps Plan

## Goals and constraints
- Provide minimal apps that each showcase a small, testable set of asset patterns.
- Keep the asset-manager component in `convex/components/asset-manager` and reuse it.
- Use Convex storage for most examples; use R2 in exactly one example app.
- Keep frontend code agnostic to storage backend where possible. Only the `convex/`
  folder differs when switching to R2.
- Use Vite for the simplest hosting and fastest iteration, NextJS for SSG/static
  builds, and TanStack Start for loader and prefetch comparisons.
- Reuse the generic admin panel (Next and TanStack) to demonstrate production usage.
- Make verification easy with versioned text assets, metadata display, and clear
  caching headers.

## Patterns to demonstrate
- Public assets with CDN URLs and cache invalidation via versioned URLs.
- Private assets with signed URLs, HTTP endpoints, and auth checks.
- Upload flow for public and private assets: startUpload -> PUT -> finishUpload.
- Reactive queries that update UI when a published version changes.
- Browser caching and CDN caching behaviors (immutable URLs).
- Per-user auth and per-team access control.
- Static builds that do not open a Convex session at runtime.
- Static builds that rehydrate and open a Convex session for live updates.
- Prefetching patterns and loader usage in NextJS vs TanStack Start.
- Long TTL private video flow (range requests and long playback sessions).

## Example app catalog (overview)

| App name | Framework | Storage | Focus |
| --- | --- | --- | --- |
| `vite-text-assets` | Vite | Convex | Versioned text assets, reactivity, browser cache |
| `vite-private-vault` | Vite | Convex | Signed URLs, HTTP endpoint, auth, private video TTL |
| `vite-public-cdn-gallery` | Vite | R2 | Public CDN URLs, cache behavior, upload flow |
| `tanstack-team-library` | TanStack Start | Convex | Teams, auth, reactivity, loader prefetch |
| `nextjs-static-marketing` | NextJS | Convex | Static home + rehydrated live preview + admin |
| `nextjs-asset-explorer` | NextJS | Convex | Prefetch comparison, admin integration |

## App details

### 1) `vite-text-assets`
Purpose: the smallest possible demo to prove versioning, reactivity, and caching.

Patterns covered:
- Draft/published version changes trigger reactive updates.
- Versioned URLs and browser caching behavior.
- Upload flow with small text files.

Key UI:
- List of assets in a folder (text files only).
- Inline display of file content and metadata (versionId, publishedAt, size).
- A "Publish new version" button that uploads and publishes.

Verification:
- Observe the URL change when a new version is published.
- Confirm that reloading uses the cached URL for unchanged assets.
- Show metadata in the UI for quick correctness checks.

Admin:
- Use generic admin panel to upload/publish assets for live update tests.

### 2) `vite-private-vault`
Purpose: demonstrate the full private flow with auth, signed URLs, and HTTP endpoint.

Patterns covered:
- HTTP endpoint `/private/v/*` with auth checks.
- Signed URL generation and short vs long TTL.
- Per-user access control and private asset metadata.
- Browser caching for immutable version URLs.

Key UI:
- User sign-in (simple local auth or token-based demo).
- "My files" list with private images and documents.
- Private video player with long TTL (1 to 4 hours).
- "Rotate version" button to publish a new version for live updates.

Verification:
- Confirm `401` without auth.
- Confirm private URL changes after publish.
- Confirm video playback does not break when seeking (long TTL).

Admin:
- Admin can create users and upload per-user assets.

### 3) `vite-public-cdn-gallery` (R2 only)
Purpose: show CDN URLs, caching, and public access via R2.

Patterns covered:
- R2 backend configuration and CDN URL usage.
- Public assets with immutable URLs.
- Upload flow for public assets.
- CDN cache behavior and browser cache reuse.

Key UI:
- Public image and audio gallery.
- Display of CDN URL and versionId next to each asset.
- Simple "refresh" button to demonstrate reactivity.

Verification:
- Compare URL changes on publish.
- Confirm that CDN URL changes on new versions (cache invalidation).
- Use response headers to confirm long cache control.

Admin:
- Use admin panel to publish new versions during live testing.

### 4) `tanstack-team-library`
Purpose: demonstrate teams and auth, plus TanStack loader and prefetch patterns.

Patterns covered:
- Team membership and role-based access to assets.
- Reactive list of team assets (folder per team).
- Loader usage with prefetch on hover.
- Compare loader prefetch to NextJS prefetch.

Key UI:
- Team switcher and role display.
- Team asset list with per-item prefetch on hover.
- Asset details page driven by loader data.

Verification:
- Switch teams and see reactive updates.
- Hover to prefetch and confirm reduced navigation time.

Admin:
- Team management through generic admin panel or a minimal admin route.

### 5) `nextjs-static-marketing`
Purpose: show a static home page plus an authenticated live preview that rehydrates
into a Convex session, and a shared admin route.

Patterns covered:
- Static home page with no Convex client at runtime (no session).
- Static build that rehydrates and opens a Convex session for reactive updates.
- Asset URLs generated at build time for the home page.
- Server-side live preview that fetches latest data via `convexHttpClient`.

Key UI:
- `/` route: purely static marketing page, no Convex session.
- `/live` route: authed preview with initial data injected (server fetch), then
  client rehydrates into a Convex session for reactive updates.
- `/admin` route: generic admin panel with built-in Convex auth.
- A "build info" panel (on `/live` only) listing the asset URLs baked at build time.

Verification:
- Deploy static build and confirm no websocket or session on `/`.
- Publish a new asset version and observe `/live` update via rehydration.
- Ensure `/` remains unchanged until rebuild.

Admin:
- `/admin` is the trigger point for publishing new versions.

### 6) `nextjs-asset-explorer`
Purpose: provide a direct comparison of prefetching patterns with NextJS.

Patterns covered:
- NextJS prefetch via `<Link prefetch>` and `router.prefetch`.
- Hover prefetch for asset metadata and optional thumbnails.
- Comparison against TanStack loader prefetch in `tanstack-team-library`.

Key UI:
- Asset list with hover prefetch and navigation timing display.
- Detail page that reports whether data came from prefetch or live fetch.

Verification:
- Use a latency toggle in the API to show prefetch benefits.
- Confirm prefetch is skipped when disabled.

Admin:
- Optional admin link to update assets for live reactivity tests.

## Shared implementation notes
- Folder layout conventions for assets:
  - `public/marketing/*` for public demo assets
  - `private/users/{userId}/*` for per-user assets
  - `teams/{teamId}/*` for team assets
- Use small, versioned text assets to validate versionId and publishedAt quickly.
- Include a metadata panel in each app (versionId, size, contentType, cache headers).
- Use Convex built-in auth for all demos (easy to swap for Clerk later).
- For R2, only the `convex/` setup differs; frontend code uses the same queries.
  Prefer `r2` when env is configured, otherwise fall back to Convex storage for
  fast local onboarding.
- Prefer importing the generic admin panel and mounting it as a route in each app.
  If this becomes too complex to keep clean, fall back to a monorepo-style
  dedicated admin app that points at shared Convex data.

## Build plan (step-by-step)
1) Ship `vite-text-assets` to lock down the simplest asset, versioning, and
   reactivity flows. Use this as a baseline for UI patterns and metadata checks.
2) Add `vite-private-vault` with signed URLs and HTTP endpoint. Validate auth,
   per-user access, and the long TTL video flow.
3) Add `vite-public-cdn-gallery` as the only R2-backed app. Validate CDN URLs,
   caching headers, and immutable URL behavior.
4) Build `tanstack-team-library` to cover teams and loader-based prefetch.
5) Build `nextjs-static-marketing` to demonstrate static no-session vs static
   with live updates. Keep build-time URL generation minimal.
6) Build `nextjs-asset-explorer` and align it with the TanStack prefetch route
   for direct comparison.
7) Clean and align the existing NextJS and TanStack admin routes to match the
   simplified patterns above.

## Static build URL generation
- Use NextJS `force-static` with `convexHttpClient` in the `/` route so data is
  fetched at build time and no Convex session exists at runtime.
- Provide a live preview route that reads data via `convexHttpClient` for admins
  to see changes instantly without rebuilding, then rehydrates into `useQuery`.
- Show a minimal CLI example of `convex run` to export the same data for other
  static build pipelines (non-Next or CI-driven exports).
- Keep the page UI shared by rendering the same React component in both routes,
  and wrap only `/live` + `/admin` in a Convex provider (route-group layout).
- Share query args and server fetch logic from a single module to avoid duplicate
  client configuration and query definitions.
