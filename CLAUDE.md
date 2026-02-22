# Fuel Watch - Project Instructions

## Spec-Driven Development

This project follows a spec-driven design. All specifications live in `specs/` and are the source of truth. See `specs/README.md` for the full index.

### Regenerating code from specs

When asked to regenerate a module, follow this process:

1. **Read the relevant spec** from `specs/` first
2. **Read dependent specs** (e.g., if generating a component, also read `02-data-model.md` and `04-styles.md`)
3. **Generate the code** following the spec exactly - types, queries, classes, logic, edge cases
4. **Write to the correct path** as defined in `01-architecture.md`

### Commands

- **"regenerate [module]"** - Read the spec and rewrite the source file. Examples:
  - "regenerate search API" → read `specs/api/search.md` + `specs/services/fuel-service.md` → write `src/pages/api/search.ts`
  - "regenerate StationCard" → read `specs/components/station-card.md` + `specs/04-styles.md` → write `src/components/StationCard.tsx`
  - "regenerate fuel service" → read `specs/services/fuel-service.md` + `specs/services/search-conditions.md` → write `src/lib/fuel.ts`
  - "regenerate all" → regenerate every source file in order: config → styles → services → API → components

- **"update spec [module]"** - Read the current source file and update the corresponding spec to match. Use after manual code changes.

- **"diff spec [module]"** - Compare the current source code against the spec and report discrepancies.

### Regeneration order (for "regenerate all")

1. `src/lib/supabase.ts` ← `specs/services/supabase-client.md`
2. `src/styles/global.css` ← `specs/04-styles.md`
3. `src/lib/fuel.ts` ← `specs/services/fuel-service.md` + `specs/services/search-conditions.md`
4. `src/pages/api/search.ts` ← `specs/api/search.md`
5. `src/pages/api/history.ts` ← `specs/api/history.md`
6. `src/pages/api/stats.ts` ← `specs/api/stats.md`
7. `src/pages/api/suggestions.ts` ← `specs/api/suggestions.md`
8. `src/pages/api/update-prices.ts` ← `specs/api/update-prices.md`
9. `src/components/PriceChart.tsx` ← `specs/components/price-chart.md`
10. `src/components/StationCard.tsx` ← `specs/components/station-card.md`
11. `src/components/FuelApp.tsx` ← `specs/components/fuel-app.md` + `specs/components/filter-form.md`
12. `src/layouts/Layout.astro` ← `specs/components/layout.md`
13. `src/pages/index.astro` ← `specs/components/layout.md`

### Rules

- **Specs are the contract, code is the implementation.** When regenerating, follow the spec literally.
- **After modifying code**, always update the corresponding spec with "update spec [module]".
- **Never add features** that aren't in the specs. If a new feature is needed, update the spec first, then regenerate.
- All source files are in `frontend_astro/src/`.
- Use Tailwind classes exactly as documented in `specs/04-styles.md`.
- Use the data types exactly as documented in `specs/02-data-model.md`.

## Tech Stack

- Astro 5.x + React 19 + Tailwind CSS 4 + Supabase + Recharts
- Deployed on Cloudflare Pages (SSR mode)
- Working directory for dev: `frontend_astro/`
