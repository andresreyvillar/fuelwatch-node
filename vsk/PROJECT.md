# Reglas propias de fuel-watch

Complementa `vsk/CONSTITUTION.md` con lo que solo aplica a este proyecto. El upgrade del kit no
toca este fichero. Cada regla nace de un hecho (una lección, una restricción del cliente, del stack o del
entorno) y dice dónde queda comprobada.

## Stack y entorno

- La única aplicación viva está en `frontend_astro/`: Astro 5 (SSR) + React 19 + Tailwind 4 + Supabase +
  Recharts, desplegada en Cloudflare Pages. `backend_nestjs/`, `backend_legacy/` y los ficheros Angular de
  la raíz son legado: ningún slice los toca. *Comprobado en:* `architecture.yaml` (no tienen componente).
- Tests con Vitest en `frontend_astro/`. El harness ejecuta desde la raíz, así que los comandos usan
  `npx --prefix frontend_astro vitest run --root frontend_astro`. *Comprobado en:* gates `red`, `green`, `tests`.
- ESLint, Prettier y Playwright no están instalados: los gates `lint`, `format` y `e2e` son opcionales
  hasta que se configuren. *Comprobado en:* `vsk.config.yaml`.
- El gate `security` aplica a todo cambio. Además, tocar `src/lib/supabase.ts`, `api/update-prices.ts`,
  `scripts/sync-prices.mjs` o `wrangler.*` obliga a nivel `standard` como mínimo.
  *Comprobado en:* gate `ceremony` (`ceremony.sensitive`).
- Las credenciales de Supabase del frontend están hardcodeadas en `src/lib/supabase.ts` (anon key pública)
  porque Cloudflare Pages no inyecta env vars en el runtime SSR. No se migran a `import.meta.env` /
  `process.env` sin un slice que lo resuelva en Cloudflare. *Comprobado en:* gate `security`.
- La sincronización de precios existe dos veces con la misma lógica: `scripts/sync-prices.mjs` (GitHub
  Actions, cada hora, la de producción) y `updateDataFromMinistry()` en `src/lib/fuel.ts`
  (`/api/update-prices`). Un slice que cambie parseo, mapeo o URL del Ministerio cubre ambos.
  *Comprobado en:* gate `traceability`.

## Arquitectura

Estilo: **por capas**, sin gate de dependencias (sin dependency-cruiser). Las capas son las de
`vsk/architecture.yaml`:

| Capa | Módulo (capability) | Ruta |
|---|---|---|
| Entrada | UI | `frontend_astro/src/components/**`, `layouts/**`, `pages/index.astro` |
| Entrada | API HTTP | `frontend_astro/src/pages/api/**` |
| Dominio | Servicio de carburantes | `frontend_astro/src/lib/fuel.ts` |
| Dominio | Script de sync | `scripts/sync-prices.mjs` |
| Datos | Cliente Supabase | `frontend_astro/src/lib/supabase.ts` |

Reglas de dependencia (revisadas en el gate `clean-code`, no automatizadas):
- La UI solo habla con la API HTTP (`fetch('/api/...')`); nunca importa `lib/fuel.ts` ni `lib/supabase.ts`.
- Los endpoints de `pages/api/` delegan en `lib/fuel.ts`; no consultan Supabase directamente.
  Excepciones heredadas, anotadas en `vsk/debt.txt`: `suggestions.ts` y los `debug*.ts` importan
  `lib/supabase.ts`. Ningún endpoint nuevo amplía la lista.
- Solo `lib/fuel.ts` importa `lib/supabase.ts`. `scripts/sync-prices.mjs` es independiente (Node, fuera
  de Cloudflare) y no importa nada de `frontend_astro/`.

## Restricciones del dominio

- La fuente de datos es la API REST del Ministerio (`energia.serviciosmin.gob.es/ServiciosRestCarburantes`).
  Los precios llegan como texto con coma decimal. Un precio sin dato se guarda como 0 en la estación y
  como `null` en el histórico; solo los precios > 0 son válidos.
- `specs/` (flujo de regeneración anterior) es documentación de partida para la ontología. Las specs
  consolidadas del VSK viven en `openspec/specs/`.

## Datos y privacidad

- Favoritos del usuario solo en `localStorage`; no hay cuentas ni datos personales en Supabase.

## Reglas nacidas de lecciones
