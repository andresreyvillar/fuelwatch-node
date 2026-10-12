# Recibo — borrar-endpoints-debug

**Veredicto:** LISTO PARA COMMIT

## Qué cambió

- `frontend_astro/src/pages/api/debug.ts` — borrado (sonda sin spec).
- `frontend_astro/src/pages/api/debug-ministry.ts` — borrado.
- `frontend_astro/src/pages/api/debug-upsert.ts` — borrado; escribía en Supabase y fallaría tras migrar las coordenadas.
- `frontend_astro/src/pages/api/test.ts` — borrado.
- `frontend_astro/src/lib/provinces.ts` — recibe el tipo `Suggestion`.
- `frontend_astro/src/lib/fuel.ts` — importa `Suggestion` de `provinces.ts`.
- `frontend_astro/src/components/FuelApp.tsx` — deja de importar de `lib/fuel.ts` (regla de `PROJECT.md`).
- `specs/components/fuel-app.md` — imports.
- `specs/services/fuel-service.md` — dónde vive `Suggestion`.
- `vsk/debt.txt` — sin deuda de arquitectura.
- `vsk/PROJECT.md` — reglas de dependencia sin excepciones.
- `vsk/architecture.yaml` — endpoints actuales.
- `CLAUDE.md` — sin mención a endpoints debug.

## Comprobado

- `tsc --noEmit` limpio; suite 33/33; build correcto.

## Pendiente

- Nada.
