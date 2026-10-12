# Recibo — osrm-user-agent

**Veredicto:** LISTO PARA COMMIT

## Qué cambió

- `frontend_astro/src/lib/fuel.ts` — `fetchRoute()` envía `User-Agent` a OSRM; sin él responde 403 desde Cloudflare.
- `frontend_astro/tests/ruta-gasolineras/route-stations.test.ts` — el OSRM simulado exige `User-Agent`, como el real.
- `specs/api/route-stations.md` — cabecera documentada.

## Comprobado

- Rojo real con el doble estricto (8 tests en 502, igual que producción); verde 44/44 tras el arreglo.
- `tsc` y build limpios; OSRM responde 200 con esa cabecera (`curl -A`).

## Pendiente

- Comprobar `/api/route-stations` en producción tras el despliegue · agente.
