# Recibo — coordenadas-numericas

**Veredicto:** LISTO PARA COMMIT

## Qué cambió

- `scripts/sync-prices.mjs` — `parseCoordinate()` y `toStation()` exportados; sincroniza solo al lanzarse con node (también por enlace simbólico).
- `frontend_astro/src/lib/fuel.ts` — `updateDataFromMinistry()` guarda coordenadas con `parseCoordinate()`.
- `supabase/coordenadas-numericas.sql` — migración a `double precision` con copia, `lock_timeout`, índice y comprobaciones. La ejecuta el humano.
- `frontend_astro/tests/coordenadas-numericas/sync-script.test.ts` — escenarios en el script.
- `frontend_astro/tests/coordenadas-numericas/update-prices.test.ts` — escenarios y regresión en el endpoint.
- `specs/02-data-model.md` — tipos, `parseCoordinate` y migración.
- `specs/api/update-prices.md` — parseo de coordenadas.
- `specs/flows/data-sync-flow.md` — paso 3b.
- `vsk/PROJECT.md` — regla de parseo igual en código y migración.
- `vsk/lessons.yaml` — lección `parseo-igual-en-codigo-y-migracion`.
- `docs/lecciones.md` — su narración.

## Comprobado

- Semáforo 2/2 verde en las dos rutas; suite 33/33; `tsc` y build limpios; zombis 4/4.
- Gates verify en verde. Una refutación (`' '` → 0) corregida y re-verificada con el JSON real del Ministerio.
- Sin credenciales el script sigue saliendo con código 1.

## Pendiente

- Tras el despliegue y una sincronización correcta: ejecutar `supabase/coordenadas-numericas.sql` · humano.
- `debug-upsert.ts` escribe coordenadas como texto y fallará tras la migración · decide el humano (slice de seguridad).
- Preexistentes de seguridad: `update-prices` sin autenticación y con `stack`, escritura con la clave anon, endpoints de depuración expuestos · slice de seguridad.
- Datos del Ministerio: 3 estaciones con `0,000000` y la 16268 con coordenadas invertidas · decidir en el slice 3b.
