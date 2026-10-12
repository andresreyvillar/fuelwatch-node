# Tasks — direccion-en-google-maps

## 1. TDD en rojo
- [x] 1.1 `frontend_astro/tests/direccion-en-google-maps/maps.test.ts`: un `test.fails` por escenario sobre `googleMapsUrl()`
      (esqueleto en `src/lib/maps.ts`)
- [x] 1.2 `./vsk/bin/vsk semaforo direccion-en-google-maps` → ROJO
- [x] 1.3 Zombis en `zombies.yaml`

## 2. Implementación
- [x] 2.1 Rojo real; `googleMapsUrl()`; `SPAIN_BOUNDS`/`isInSpain()` en `route.ts`; enlace en `StationCard.tsx` → VERDE;
      `npx tsc --noEmit`, `npm test`, `npm run build`; probar el enlace a mano
- [x] 2.2 Zombis: `./vsk/bin/vsk zombie direccion-en-google-maps`
- [x] 2.3 Specs `station-card.md` y `services/route.md`

## 3. Refactor y verificación
- [x] 3.1 `./vsk/bin/vsk gates refactor --change direccion-en-google-maps`
- [x] 3.2 Verificación (agentes), recibo, ficheros staged uno a uno, `gates verify` en verde
