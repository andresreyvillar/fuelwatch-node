# Tasks — ruta-orden-y-distancia

Plan prescriptivo: cada paso cierra con su comando en verde. Lo ejecuta quien implementa; lo verifica otro.

## 1. TDD en rojo
- [x] 1.1 `frontend_astro/tests/ruta-orden-y-distancia/route-list.test.ts`: un `test.fails` por escenario nuevo con
      `/** @scenarios <slug> */`, sobre `src/lib/route-list.ts` (esqueleto que lanza «not implemented»)
- [x] 1.2 `./vsk/bin/vsk semaforo ruta-orden-y-distancia` → ROJO (impuesto)
- [x] 1.3 Un zombi por escenario nuevo en `zombies.yaml` (find/replace en 2.3)

## 2. Implementación
- [x] 2.1 Quitar los `.fails` y ver el ROJO REAL
- [x] 2.2 `sortRouteStations()` y `routePositionLabel()`; selector «Ordenar» y etiqueta en `RouteFinder.tsx` →
      `./vsk/bin/vsk semaforo ruta-orden-y-distancia` VERDE; `npx tsc --noEmit` y `npm run build`
- [x] 2.3 Completar find/replace de `zombies.yaml` y `./vsk/bin/vsk zombie ruta-orden-y-distancia`
- [x] 2.4 Actualizar `specs/components/route-finder.md`

## 3. Refactor (ámbar)
- [x] 3.1 `./vsk/bin/vsk gates refactor --change ruta-orden-y-distancia`

## 4. Verificación y handoff
- [x] 4.1 `./vsk/bin/vsk gates verify --change ruta-orden-y-distancia` y agentes de verificación
- [x] 4.2 `receipt.md`, ficheros staged uno a uno, gates verify en verde
