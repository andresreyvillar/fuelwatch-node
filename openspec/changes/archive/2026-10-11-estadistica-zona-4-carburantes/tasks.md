# Tasks — estadistica-zona-4-carburantes

Plan prescriptivo: cada paso cierra con su comando en verde. Lo ejecuta quien implementa; lo verifica otro.

## 1. TDD en rojo
- [x] 1.1 `frontend_astro/tests/estadistica-zona-4-carburantes/stats.test.ts`: un `test.fails` por escenario
      con `/** @scenarios <slug> */`, llamando a `GET` de `src/pages/api/stats.ts` con `vi.mock('../../src/lib/supabase')`
- [x] 1.2 `./vsk/bin/vsk semaforo estadistica-zona-4-carburantes` → todos ROJO (impuesto)
- [x] 1.3 Un zombi por escenario declarado en `zombies.yaml` (find/replace se completan en 2.3)

## 2. Implementación
- [x] 2.1 Quitar los `.fails` y ver el ROJO REAL: `./vsk/bin/vsk semaforo estadistica-zona-4-carburantes`
      (los tests de regresión «comportamiento que se conserva» siguen en verde todo el ciclo)
- [x] 2.2 En `frontend_astro/src/lib/fuel.ts`, `getStats()`: una función pura que, para cada carburante,
      filtra precios > 0 y devuelve `{ min, max, avg }` o lo omite; `null` si no queda ninguno →
      `./vsk/bin/vsk semaforo estadistica-zona-4-carburantes` VERDE
- [x] 2.3 Completar find/replace de `zombies.yaml` y `./vsk/bin/vsk zombie estadistica-zona-4-carburantes`
- [x] 2.4 Actualizar `specs/api/stats.md` (respuesta con cuatro claves, omisión y `null`)

## 3. Refactor (ámbar)
- [x] 3.1 Skills obligatorias de refactor cargadas: `./vsk/bin/vsk skills mandatory refactor`
- [x] 3.2 `./vsk/bin/vsk gates refactor --change estadistica-zona-4-carburantes`

## 4. Verificación y handoff
- [x] 4.1 `./vsk/bin/vsk gates verify --change estadistica-zona-4-carburantes` (receipt queda pendiente hasta el handoff)
- [x] 4.2 Evidencia de los gates manuales y de skill: `./vsk/bin/vsk run add --change estadistica-zona-4-carburantes --fase verify --gate <id>=pass ...`
- [x] 4.3 `receipt.md` desde `vsk/templates/receipt.md`, de 300 palabras como máximo
- [ ] 4.4 `git add` fichero a fichero, exactamente los del recibo (nunca `git add .`)
- [ ] 4.5 `./vsk/bin/vsk gates verify --change estadistica-zona-4-carburantes` → todo en verde, también receipt

## Comandos

```bash
./vsk/bin/vsk gates all --change estadistica-zona-4-carburantes
```
