# Tasks — historico-ultimos-30-dias

Plan prescriptivo: cada paso cierra con su comando en verde. Lo ejecuta quien implementa; lo verifica otro.

## 1. TDD en rojo
- [x] 1.1 `frontend_astro/tests/historico-ultimos-30-dias/history.test.ts`: un `test.fails` por escenario con
      `/** @scenarios <slug> */`, llamando a `GET` de `src/pages/api/history.ts` con un `price_history` falso que
      aplica `eq`/`gte`/`order`/`limit` sobre filas sembradas y el reloj fijado con `vi.setSystemTime`
- [x] 1.2 `./vsk/bin/vsk semaforo historico-ultimos-30-dias` → todos ROJO (impuesto)
- [x] 1.3 Un zombi por escenario declarado en `zombies.yaml`

## 2. Implementación
- [x] 2.1 Quitar los marcadores y ver el ROJO REAL: `./vsk/bin/vsk semaforo historico-ultimos-30-dias`
- [x] 2.2 En `frontend_astro/src/lib/fuel.ts`, `getStationHistory()`: filtro `fecha >= hoy − 29` (UTC), sin `limit(30)` →
      `./vsk/bin/vsk semaforo historico-ultimos-30-dias` VERDE
- [x] 2.3 Completar find/replace de `zombies.yaml` y `./vsk/bin/vsk zombie historico-ultimos-30-dias` → cada zombi cae justo en su test
- [x] 2.4 Actualizar `specs/api/history.md` y `specs/services/fuel-service.md` (ventana de 30 días)

## 3. Refactor (ámbar)
- [x] 3.1 Skills obligatorias de refactor cargadas: `./vsk/bin/vsk skills mandatory refactor`
- [x] 3.2 `./vsk/bin/vsk gates refactor --change historico-ultimos-30-dias`

## 4. Verificación y handoff
- [x] 4.1 `./vsk/bin/vsk gates verify --change historico-ultimos-30-dias` (receipt queda pendiente hasta el handoff)
- [x] 4.2 Evidencia de los gates manuales y de skill: `./vsk/bin/vsk run add --change historico-ultimos-30-dias --fase verify --gate <id>=pass ...`
- [x] 4.3 `receipt.md` desde `vsk/templates/receipt.md`, de 300 palabras como máximo
- [ ] 4.4 `git add` fichero a fichero, exactamente los del recibo (nunca `git add .`)
- [ ] 4.5 `./vsk/bin/vsk gates verify --change historico-ultimos-30-dias` → todo en verde, también receipt

## Comandos

```bash
./vsk/bin/vsk gates all --change historico-ultimos-30-dias
```
