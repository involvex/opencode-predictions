# AGENTS.md

## Commands

- `bun install --frozen-lockfile` — install from `bun.lock`
- `bun test` / `bun test tests/*.test.ts` — unit and GUI fixture tests
- `bun run typecheck` — `tsc --noEmit`
- `bun run bundle` — Bun.build for server/TUI/rpc/pilot; Vite for Desktop GUI
- `bun run check` — test + typecheck + bundle
- `bun run test:package` — packed export and GUI import-graph checks
- Publish stays `npm publish` (OpenCode installs from npm)

## Layout

- `src/index.ts` — server plugin (RPC, preferences, catalog)
- `src/tui.ts` / `src/gui.ts` — CLI and Desktop clients
- `src/catalog.ts` — location-scoped model catalog projection
- `src/setup-*.ts` — Predictions Setup editor
- `dist/` — published bundles
- `tests/` — unit + Playwright setup-gui fixtures; `tests/host/` needs a real OpenCode

## Conventions

- Bun is the package manager and test runner; keep `node:` imports for portability
- Server catalog reads use the request/plugin location; predictions still require an explicit saved model
- GUI must not import Node built-ins

## Gotchas

- `model.list` is location-scoped and may be empty before providers settle; Setup falls back to provider inventories when present
- Desktop settings are writable only after the sidecar location is known
- Host native tests need OpenCode Desktop/CLI; CI `check` does not run them
- On Windows, preference/backup files report mode `0o666`; Unix `0o177` / ownership checks must stay behind `process.getuid`, or Save fails with “backup has unsafe permissions”
- Do not run the host suite on Windows without cleaning up leftover `opencode serve` children (they exhaust RAM)

## Current work

- Windows preference Save (ACL-mapped backup modes) + Bun toolchain / location-aware catalog

## Learned preferences

- Prefer Bun scripts over npm/node for this repo's local and CI loops
- Keep npm as the publish target for the OpenCode plugin registry

## Learned workspace facts

- Empty Predictions Setup catalog greys out “Add model” until a row is picked; patterns stay usable
- RPC registrations are location-scoped; clients pass `location` on every Setup call
