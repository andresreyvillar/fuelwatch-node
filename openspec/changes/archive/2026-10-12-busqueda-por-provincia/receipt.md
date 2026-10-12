# Recibo — busqueda-por-provincia

**Veredicto:** LISTO PARA COMMIT

## Qué cambió

- `frontend_astro/src/lib/provinces.ts` — 52 provincias, coincidencia sin tildes ni artículo, `provinceSortFuel()`, columnas de orden.
- `frontend_astro/src/lib/fuel.ts` — `searchStationsByProvince()`, `getProvinceStats()`, `getSuggestions()`; `.or()` con valores entre comillas.
- `frontend_astro/src/pages/api/search.ts` — `province` + `fuel`, 400 si `fuel` no es válido.
- `frontend_astro/src/pages/api/stats.ts` — `province`.
- `frontend_astro/src/pages/api/suggestions.ts` — delega en `lib/fuel.ts`; `{ tipo, nombre }`.
- `frontend_astro/src/components/FuelApp.tsx` — sugerencias con tipo (botón), modo provincia, orden coherente, persistencia.
- `frontend_astro/tests/busqueda-por-provincia/search.test.ts` — escenarios y regresión.
- `frontend_astro/tests/busqueda-por-provincia/stats.test.ts` — escenario y regresión.
- `frontend_astro/tests/busqueda-por-provincia/suggestions.test.ts` — escenarios, paréntesis, inyección, espacios.
- `frontend_astro/tests/busqueda-por-provincia/sort-fuel.test.ts` — escenario.
- `frontend_astro/tests/support/fake-supabase.ts` — tan estricto como PostgREST en `.or()`.
- `specs/api/search.md` — modo provincia.
- `specs/api/stats.md` — `province`.
- `specs/api/suggestions.md` — formato nuevo y entrecomillado.
- `specs/services/fuel-service.md` — funciones nuevas.
- `specs/components/fuel-app.md` — estado, efectos y funciones del modo provincia.
- `specs/components/filter-form.md` — sugerencias con tipo.
- `vsk/debt.txt` — retirada la deuda de `suggestions.ts`.
- `vsk/PROJECT.md` — regla de `.or()` entrecomillado.
- `vsk/lessons.yaml` — lección `falso-supabase-tan-estricto-como-postgrest`.
- `docs/lecciones.md` — su narración.

## Comprobado

- Semáforo 8/8 verde; suite 26/26; `tsc` y build limpios; zombis 8/8.
- Gates verify en verde. Una refutación («coruña (a)» → 500) corregida y re-verificada.
- Smoke contra Supabase real (solo GET). Interfaz sin test automático.

## Pendiente

- Seguridad baja · slice aparte, decide el humano: `page`/`limit` sin cota, `getSearchConditions()` con `\(`, `error.message` en 500, RLS de `price_history`.
- Estadística de provincia sin paginar: falla en silencio si una provincia supera 1000 estaciones (hoy máx. 914) · decide el humano.
- Probar la interfaz en el navegador · humano.
