# Tasks — coordenadas-numericas

Plan prescriptivo: cada paso cierra con su comando en verde. Lo ejecuta quien implementa; lo verifica otro.

## 1. TDD en rojo
- [x] 1.1 `frontend_astro/tests/coordenadas-numericas/{sync-script,update-prices}.test.ts`: un `test.fails` por escenario y
      ruta, con `/** @scenarios <slug> */`; `fake-supabase.ts` registra los `upsert` tras un viaje por JSON
- [x] 1.2 `./vsk/bin/vsk semaforo coordenadas-numericas` → todos ROJO (impuesto)
- [x] 1.3 Un zombi por escenario declarado en `zombies.yaml` (find/replace se completan en 2.3)

## 2. Implementación
- [ ] 2.1 Quitar los `.fails` y ver el ROJO REAL: `./vsk/bin/vsk semaforo coordenadas-numericas`
- [ ] 2.2 `scripts/sync-prices.mjs`: `parseCoordinate()` y `toStation()` exportados, cliente y ejecución dentro de `main`
      solo si se lanza el script; `frontend_astro/src/lib/fuel.ts`: `parseCoordinate()` en `updateDataFromMinistry()` →
      `./vsk/bin/vsk semaforo coordenadas-numericas` VERDE; `node --check scripts/sync-prices.mjs`
- [ ] 2.3 Completar find/replace de `zombies.yaml` y `./vsk/bin/vsk zombie coordenadas-numericas`
- [ ] 2.4 `supabase/coordenadas-numericas.sql`: comprobación previa, `ALTER COLUMN ... TYPE double precision USING
      NULLIF(replace(...), '')::double precision`, índice `(latitud, longitud)` y comprobación posterior
- [ ] 2.5 Actualizar `specs/02-data-model.md`, `specs/api/update-prices.md`, `specs/flows/data-sync-flow.md`

## 3. Refactor (ámbar)
- [ ] 3.1 Skills obligatorias de refactor cargadas: `./vsk/bin/vsk skills mandatory refactor`
- [ ] 3.2 `./vsk/bin/vsk gates refactor --change coordenadas-numericas`

## 4. Verificación y handoff
- [ ] 4.1 `./vsk/bin/vsk gates verify --change coordenadas-numericas` (receipt queda pendiente hasta el handoff)
- [ ] 4.2 Evidencia de los gates manuales y de skill: `./vsk/bin/vsk run add --change coordenadas-numericas --fase verify --gate <id>=pass ...`
- [ ] 4.3 `receipt.md` desde `vsk/templates/receipt.md`, de 300 palabras como máximo
- [ ] 4.4 `git add` fichero a fichero, exactamente los del recibo (nunca `git add .`)
- [ ] 4.5 `./vsk/bin/vsk gates verify --change coordenadas-numericas` → todo en verde, también receipt

## 5. Después del merge (humano)
- [ ] 5.1 Comprobar el despliegue y que la siguiente sincronización de Actions termina bien
- [ ] 5.2 Ejecutar `supabase/coordenadas-numericas.sql` en el editor SQL de Supabase y revisar sus comprobaciones
