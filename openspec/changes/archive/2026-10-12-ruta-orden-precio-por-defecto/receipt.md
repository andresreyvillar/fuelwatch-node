# Recibo — ruta-orden-precio-por-defecto

**Veredicto:** LISTO PARA COMMIT

## Qué cambió

- `frontend_astro/src/components/RouteStationList.tsx` — el selector «Ordenar» empieza en «Por precio» (primera opción).
- `specs/components/route-finder.md` — valor por defecto.
- `vsk/PROJECT.md` — regla: `vsk run add` solo tras ver el resultado.
- `vsk/lessons.yaml` — lección `run-add-solo-tras-ver-el-resultado`.
- `docs/lecciones.md` — su narración.

## Comprobado

- `tsc --noEmit` limpio; suite 46/46; build correcto.

## Pendiente

- Probar en el navegador · humano.
