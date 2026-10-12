# Proposal — osrm-user-agent

> **Slice:** N/A (corrige `ruta-gasolineras` en producción sin cambiar su contrato)
> **Nivel:** `trivial`

## Por qué

En producción (Cloudflare) `/api/route-stations` responde siempre 502 «Routing unavailable» en 0,2-0,4 s. OSRM
(`router.project-osrm.org`) responde 403 a toda petición sin cabecera `User-Agent` (comprobado con `curl -H
"User-Agent:"` → 403 de 146 B; con cualquier valor → 200), y el `fetch` de Cloudflare Workers no la envía. En
local funcionaba porque Node sí la pone. El doble de OSRM de los tests no exigía la cabecera.

## Qué cambia

- `frontend_astro/src/lib/fuel.ts` — `fetchRoute()` envía `User-Agent: FuelWatch/1.0 (+https://fuelwatch.pages.dev)`
  (además, la política de uso de OSRM pide identificar la aplicación).
- `frontend_astro/tests/ruta-gasolineras/route-stations.test.ts` — el OSRM simulado responde 403 sin `User-Agent`,
  como el real (lección `falso-supabase-tan-estricto-como-postgrest` y `contrato-externo-probado-contra-el-servicio-real`).

## Fuera de alcance

- Otro proveedor de rutas: solo si tras este arreglo OSRM bloqueara las IP de Cloudflare.

## Riesgos y seguridad

Ninguno nuevo: una cabecera fija sin datos del usuario.
