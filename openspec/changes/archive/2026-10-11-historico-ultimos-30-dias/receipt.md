# Recibo — historico-ultimos-30-dias

**Veredicto:** LISTO PARA COMMIT

## Qué cambió

- `frontend_astro/src/lib/fuel.ts` — `getStationHistory()` filtra `fecha >= hoy − 29` (UTC) y deja de cortar en 30 filas, que devolvía los 30 días más antiguos.
- `frontend_astro/tests/historico-ultimos-30-dias/history.test.ts` — fuera los `test.fails`: los tres escenarios son tests normales.
- `specs/api/history.md` — ventana de 30 días, sin límite de filas, `[]` sin datos recientes.
- `specs/services/fuel-service.md` — consulta con `historyWindowStart()`.

## Comprobado

- Semáforo: rojo real 3/3 → verde 3/3; regresión 3/3; suite 12/12; `tsc --noEmit` limpio.
- Zombis 3/3.
- `./vsk/bin/vsk gates verify --change historico-ultimos-30-dias` → traceability, adversarial (sin refutación, también contra Supabase real), security y docs en verde.

## Pendiente

- Previos de seguridad (baja): `id` no numérico da 500 con el mensaje de la base de datos; revisar si las políticas RLS de `price_history` permiten escribir con la clave anon pública · slice aparte, decide el humano.
