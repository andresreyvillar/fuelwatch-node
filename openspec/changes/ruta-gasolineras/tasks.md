# Tasks — ruta-gasolineras

Plan prescriptivo: cada paso cierra con su comando en verde. Lo ejecuta quien implementa; lo verifica otro.
Diseño: `design.md`. **Bloqueado para desplegar** hasta que el humano ejecute `supabase/coordenadas-numericas.sql`.

## 1. TDD en rojo
- [x] 1.1 `frontend_astro/tests/ruta-gasolineras/route-stations.test.ts`: un `test.fails` por escenario con
      `/** @scenarios <slug> */`; ruta recta sintética de 222 km, OSRM simulado con `fetch`, Supabase falso
- [x] 1.2 `./vsk/bin/vsk semaforo ruta-gasolineras` → todos ROJO (impuesto)
- [x] 1.3 Un zombi por escenario declarado en `zombies.yaml` (find/replace se completan en 2.4)

## 2. Implementación
- [x] 2.1 Quitar los `.fails` y ver el ROJO REAL: `./vsk/bin/vsk semaforo ruta-gasolineras`
- [x] 2.2 `src/lib/route.ts` (geometría pura), `findStationsAlongRoute()` en `src/lib/fuel.ts`,
      `src/pages/api/route-stations.ts` → `./vsk/bin/vsk semaforo ruta-gasolineras` VERDE
- [x] 2.3 Con permiso del humano: `npm install leaflet@1.9.4 react-leaflet@5.0.0` y `-D @types/leaflet@1.9.22` en
      `frontend_astro`; `RouteFinder.tsx` + `RouteMap.tsx` (lazy) y pestañas en `FuelApp.tsx`; `npx tsc --noEmit`,
      `npm run build` y prueba manual con `npm run dev` (Vigo → Madrid, cambiar desvío y carburante)
- [x] 2.4 Completar find/replace de `zombies.yaml` y `./vsk/bin/vsk zombie ruta-gasolineras`
- [x] 2.5 Specs nuevas `specs/api/route-stations.md`, `specs/services/route.md`, `specs/components/route-finder.md`;
      actualizar `specs/components/fuel-app.md`, `specs/01-architecture.md`, `specs/README.md`

## 3. Refactor (ámbar)
- [x] 3.1 Skills obligatorias de refactor cargadas: `./vsk/bin/vsk skills mandatory refactor`
- [x] 3.2 `./vsk/bin/vsk gates refactor --change ruta-gasolineras`

## 4. Verificación y handoff
- [x] 4.1 `./vsk/bin/vsk gates verify --change ruta-gasolineras` (receipt queda pendiente hasta el handoff)
- [x] 4.2 Evidencia de los gates manuales y de skill: `./vsk/bin/vsk run add --change ruta-gasolineras --fase verify --gate <id>=pass ...`
- [x] 4.3 `receipt.md` desde `vsk/templates/receipt.md`, de 300 palabras como máximo
- [ ] 4.4 `git add` fichero a fichero, exactamente los del recibo (nunca `git add .`)
- [ ] 4.5 `./vsk/bin/vsk gates verify --change ruta-gasolineras` → todo en verde, también receipt
