# Meaningful Mode

Monthly cause-based campaigns. Content lives in `content/campaigns/`.

**Shared with the API.** `domain/`, `content/` and the non-UI services the
server needs (catalogue, period, progress, participation rules, badge
award, evaluation) are imported directly by the Vercel functions in
`api/`. Those files must therefore:

- use relative imports with a `.js` extension (no `@/` alias), and
- stay free of browser and Firebase client APIs.

`npx tsc -p tsconfig.api.json` fails if either rule is broken.
