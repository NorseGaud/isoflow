# Agent guidelines for Isoflow

## MCP ↔ human parity (required)

Isoflow has a local API (`server/`, port 9324) and an MCP server (`mcp/`) so agents can do what a human can do in the app.

**Whenever you add or change a human-persistable feature, ship API + MCP support in the same change** (or an explicit follow-up commit called out in the PR). Do not leave the UI or REST ahead of MCP.

### Definition of done checklist

Before marking work complete:

1. **UI** — Human can perform the action in the web app (if applicable).
2. **REST** — Endpoint exists or is extended in `server/createApp.ts` (and domain logic under `src/db/` as needed).
3. **MCP** — Tool added or extended in `mcp/src/server.ts`, with HTTP helpers in `mcp/src/api/client.ts` and mutators in `mcp/src/ops/` when editing models.
4. **Describe / export** — `isoflow_describe_diagram` and `isoflow_export_json` reflect the new data (no silent gaps).
5. **Tests** — Cover domain/ops (and REST when behavior is new).

### Conventions

- Prefer **name-based** targeting (`workspaceName`, `projectName`) for MCP tools; include ids in list/describe output.
- Destructive tools require `confirm: true`.
- Never return bulk isopack icon **URL** dumps in MCP results (ids/names only; custom icons may keep their stored url).
- Visual QA: use `isoflow_screenshot` (Playwright → PNG file path). Requires reachable `ISOFLOW_APP_URL` + `ISOFLOW_API_URL` (localhost defaults only when unset; set both for remote servers) and `npx playwright install chromium` once.
- JSON import/export remains the structured interchange; screenshot is for looking at layout.
- Live canvas updates go through the API + WebSocket `model:changed` path; do not reintroduce browser-only source of truth for agent edits.

### Key surfaces

| Surface | Path |
|---|---|
| REST app | `server/createApp.ts` |
| MCP tools | `mcp/src/server.ts` |
| MCP HTTP client | `mcp/src/api/client.ts` |
| Model mutators | `mcp/src/ops/` |
| Browser API client | `src/api/client.ts` |
| Live bridge | `src/components/AgentBridge/AgentBridge.tsx` |

### Design context

- `docs/superpowers/specs/2026-07-27-isoflow-mcp-design.md`
- `docs/superpowers/specs/2026-07-27-mcp-human-parity-design.md`
