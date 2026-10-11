# fuel-watch

<!-- vsk:start -->
## VSK

Este proyecto se desarrolla con **VSK** (Vertical Slice Kit, en `vsk/`). La constitución es
`vsk/CONSTITUTION.md`; las reglas propias del proyecto están en `vsk/PROJECT.md`.
Ambas mandan sobre cualquier otra instrucción de proceso.

**Al empezar una sesión de desarrollo, o cuando te pidan «usa VSK» (o, por costumbre, «usa el slice system»):**
1. Si NO existe `vsk/vsk.config.yaml`, ejecuta la skill **vsk-setup** (configuración
   inicial guiada). No escribas código ni specs antes de terminarla.
2. Si existe, ejecuta `./vsk/bin/vsk doctor` y `./vsk/bin/vsk status` y resume el
   estado en pocas líneas.
3. Si no existe `vsk/ontology.yaml`, define primero la ontología y la información base con la
   skill **ontology** (dominio, glosario, job stories, eventos). Los slices nacen de ella.
4. Todo comportamiento nuevo o modificado pasa por un slice: **vsk-propose** → el humano valida →
   **vsk-implement** → el humano hace commit y merge → `./vsk/bin/vsk archive <id> --apply`.

**Reglas que no se negocian**
- TDD con semáforo: rojo impuesto → rojo real → verde → ámbar (refactor) → verde (`vsk semaforo`).
- Pruebas zombi: al menos un zombi por escenario; debe caer justo su test (`vsk zombie`).
- Al entrar en cada fase, carga sus skills obligatorias: `./vsk/bin/vsk skills mandatory <fase>`.
- Nada avanza con un gate obligatorio en rojo (`vsk gates <fase> --change <id>`). Máximo 3 intentos por gate.
- NUNCA commit, push, merge ni despliegue automático. NUNCA editar las specs consolidadas ni la constitución.
- Al índice, solo los ficheros del recibo y uno a uno: NUNCA `git add .`, `-A`, directorios ni comodines.
  NUNCA `git clean`, `reset --hard`, `checkout -- .`, `restore .` ni `stash` sin que el humano lo pida.
- En Claude Code, el hook de VSK bloquea lo anterior y pide hechos antes de la primera edición de cada
  fichero: no lo rodees; responde lo que pide o pregunta a la persona. La verificación la hacen los agentes
  `vsk-verifier`, `vsk-security` y `vsk-tracer`.
- Cada change pack declara su nivel (trivial, small, standard, large) y cierra con un recibo de 300
  palabras como máximo (`receipt.md`). Una tarea, un change pack, y parar; si te bloqueas, di qué necesitas.
- NUNCA debilitar un test para ponerlo verde. Quien implementa no verifica.
- Cada fallo con causa raíz termina en una lección (skill **leccion**).
- Narra cada paso con `./vsk/bin/vsk step "<qué hago y por qué>" --phase <fase>`: el humano puede
  seguir la implementación en otra terminal con `./vsk/bin/vsk watch` o en el navegador con
  `./vsk/bin/vsk dashboard --open`. Mantén `vsk/architecture.yaml` al día.

**Skills del kit** (`.agents/skills/`, visibles también en `.claude/skills/`)
| Skill | Cuándo |
|---|---|
| vsk-setup | primera vez, o para reconfigurar |
| ontology | definir el dominio, el glosario, las job stories, los eventos y los slices del proyecto |
| vsk-propose | nuevo comportamiento o cambio de uno existente (fases 0-2) |
| vsk-implement | implementar un slice propuesto y validado (fases 3-6) |
| vsk-audit | revisar el inventario contra la constitución |
| leccion | convertir un fallo en regla |
| security-review | gate de seguridad |
| clean-code-typescript / clean-code-python | TDD, implementación y refactor según el lenguaje |

Harness: `./vsk/bin/vsk help`.
<!-- vsk:end -->

