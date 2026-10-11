# Tasks — {{change}}

Plan prescriptivo: cada paso cierra con su comando en verde. Lo ejecuta quien implementa; lo verifica otro.

## 1. TDD en rojo
- [ ] 1.1 Un test por escenario con `@scenarios <slug>` y el marcador de rojo del adaptador
- [ ] 1.2 `./vsk/bin/vsk semaforo {{slug}}` → todos ROJO (impuesto)
- [ ] 1.3 Un zombi por escenario declarado en `zombies.yaml`

## 2. Implementación
- [ ] 2.1 Quitar los marcadores y ver el ROJO REAL: `./vsk/bin/vsk semaforo {{slug}}`
- [ ] 2.2 Implementar hasta VERDE
- [ ] 2.3 `./vsk/bin/vsk zombie {{change}}` → cada zombi cae justo en su test

## 3. Refactor (ámbar)
- [ ] 3.1 Skills obligatorias de refactor cargadas: `./vsk/bin/vsk skills mandatory refactor`
- [ ] 3.2 `./vsk/bin/vsk gates refactor --change {{change}}`

## 4. Verificación y handoff
- [ ] 4.1 `./vsk/bin/vsk gates verify --change {{change}}` (receipt queda pendiente hasta el handoff)
- [ ] 4.2 Evidencia de los gates manuales y de skill: `./vsk/bin/vsk run add --change {{change}} --fase verify --gate <id>=pass ...`
- [ ] 4.3 `receipt.md` desde `vsk/templates/receipt.md`, de 300 palabras como máximo
- [ ] 4.4 `git add` fichero a fichero, exactamente los del recibo (nunca `git add .`)
- [ ] 4.5 `./vsk/bin/vsk gates verify --change {{change}}` → todo en verde, también receipt

## Comandos

```bash
./vsk/bin/vsk gates all --change {{change}}
```
