---
name: vsk-implement
description: Implementa un slice ya propuesto y validado (fases 3-6 de VSK) — carga el change pack como contrato, plan confirmado por el humano, semáforo rojo real → verde → ámbar → verde, pruebas zombi, gates de verificación (seguridad, adversarial, trazabilidad) y handoff con veredicto. Usar cuando el usuario diga «implementa el slice X» o tras validar un vsk-propose.
---

# vsk-implement — fases 3 a 6

**Constitución:** `vsk/CONSTITUTION.md` §5-§9. **Reglas del proyecto:** `vsk/PROJECT.md`.
**Harness:** `./vsk/bin/vsk`.

Prerrequisito: slice y change pack existentes con los tests en ROJO (`vsk semaforo <slug>`). Si no hay
change pack, para y propón vsk-propose. Un change pack **trivial** (`Slice: N/A`) no tiene semáforo ni
zombis: implementa, pasa los gates que su nivel exige (los demás salen «omitido por nivel») y cierra con el
recibo.

**Reglas del trabajador** (constitución §7): una tarea, un change pack, y parar. Si te bloqueas, di
exactamente qué necesitas y de quién, y para; no reintentes a ciegas. Nada de revisar tu propio trabajo como
si fueras otro: los gates de verificación los hacen otros.

**Narración para el monitor.** Antes de cada paso numerado de esta skill, cuéntalo en una frase en presente,
con el porqué si no es obvio: `./vsk/bin/vsk step "<qué haces y por qué>" --phase <fase> --change <id>`
(`--detail "..."` para una segunda línea). Quien siga la implementación con `vsk watch` ve así cada paso
junto a los gates y sus salidas. Narra hechos, no intenciones vagas: «Quito los marcadores para ver el rojo
real», no «Sigo con el trabajo».

## Fase 3.1 · Cargar el contrato

Lee en este orden: `proposal.md` → `tasks.md` → deltas (`<changes>/<id>/specs/*/spec.md`: **son el
contrato**) → specs consolidadas afectadas (solo lectura) → el slice → `zombies.yaml`.
Rama: nunca en la rama base. `git switch -c <branch_pattern con {change}>` (ver `git` en la configuración).

## Fase 3.2 · Plan y confirmación

Presenta el plan: paso → ficheros → requirement que cumple → test que lo demuestra → zombi que lo protege.
**Espera confirmación explícita del humano antes de tocar código.**

## Fase 3.3 · Implementar (semáforo)

1. Carga las skills obligatorias: `./vsk/bin/vsk skills mandatory implement`.
2. Quita los marcadores de rojo y ejecuta `vsk semaforo <slug>`: todos en **ROJO REAL**. Si un test pasa
   sin implementación, no prueba lo que dice: se corrige antes de seguir. Anota el rojo real en el run.
3. Implementa hasta **VERDE**, tocando solo módulos de las capabilities de `specs[]`. Nada fuera del delta.
   Prohibido debilitar, vaciar o borrar un test para ponerlo verde.
4. Completa `verified-by:` en los deltas con los tests reales.
5. Completa `zombies.yaml` (`find`/`replace` exactos, un solo acierto en el fichero) y ejecuta
   `./vsk/bin/vsk zombie <id>`. Resultado esperado: cada zombi hace caer justo su test y la
   suite vuelve a verde.
   - «El zombi sobrevive»: el test no mira el comportamiento → refuerza el test, nunca quites el zombi.
   - «Caen tests que no deberían»: tests acoplados o estado compartido → aíslalos.
   - INCIERTO: el zombi no compila o rompe el arranque → elige una mutación de comportamiento.
   - Zombi equivalente (no cambia nada observable) → cambia el zombi, no el test.
6. Gates: `./vsk/bin/vsk gates implement --change <id>`.

## Fase 4 · Refactor (ámbar)

1. `./vsk/bin/vsk skills mandatory refactor` y carga esas skills (clean code del lenguaje).
2. Refactoriza con los tests en verde: nombres, funciones pequeñas, errores explícitos, sin duplicación,
   sin código muerto. Tras cada paso, `vsk semaforo <slug>` sigue en verde.
3. `./vsk/bin/vsk gates refactor --change <id>` hasta salir de ÁMBAR. El gate `clean-code` se
   registra tras revisar el diff con la skill: `vsk run add ... --gate clean-code=pass`.

## Fase 5 · Verificar (quien implementa no verifica)

Ejecuta `./vsk/bin/vsk gates verify --change <id>` y cubre los gates manuales y de skill. En Claude Code,
con los agentes de verificación del kit (`.claude/agents/`, `vsk agents` los lista con su modelo); cada uno
recibe solo el change pack y el escenario, nunca tu razonamiento. En Codex, lanza el mismo encargo como
subagente o pídeselo a la persona.
- **traceability:** agente `vsk-tracer`: tabla requirement → código (`ruta:línea`) → test.
- **adversarial:** agente `vsk-verifier`, 2-3 veces en paralelo (una en nivel small), cada una con un escenario
  o con todos, y el encargo *«Intenta REFUTAR que el escenario <WHEN/THEN> se cumple en este código»*. Un rojo de red o entorno es INCIERTO. Una
  refutación sostenida devuelve a la fase 3.3.
- **security:** agente `vsk-security`, que aplica la skill `security-review`. Cada hallazgo corregido se cierra con
  prueba de explotación y prueba de uso legítimo, con órdenes y salida.
- **docs:** README y docs afectados al día, o «sin cambios, verificado».
- Gates propios del proyecto (e2e, capturas...): los que liste la configuración.

Máximo 3 intentos por gate. Al tercero: parar, informar al humano y ejecutar la skill `leccion`.

## Fase 6 · Handoff

1. Registra la evidencia de los gates manuales y de skill:
   `./vsk/bin/vsk run add --change <id> --fase verify --actor agente --gate <id>=pass ... --rondas <n> --notas "..."`.
2. Si algún gate falló con causa raíz, ejecuta `leccion` antes de cerrar.
3. Escribe `<changes>/<id>/receipt.md` desde `vsk/templates/receipt.md`, **300 palabras como máximo**:
   veredicto, una viñeta por fichero cambiado (- `ruta` — qué y por qué), comprobaciones con su resultado y
   pendientes con quién los desbloquea. El detalle largo (trazabilidad, zombis, hallazgos de seguridad) va
   en el run y en los ficheros del change pack, no en el recibo.
4. Añade al índice **uno a uno** los ficheros del recibo: `git add <ruta> <ruta> ...`. NUNCA `git add .`,
   `-A`, directorios ni comodines: puede haber ficheros de otras fuentes que no deben subirse. Los ficheros
   del change pack también se añaden uno a uno. **NUNCA commit ni push.**
5. `./vsk/bin/vsk gates verify --change <id>`: todo en verde, también `receipt`, que comprueba que lo
   staged es exactamente la lista del recibo y que el veredicto coincide con los gates.
6. Tu último mensaje es el recibo, con el veredicto: **LISTO PARA COMMIT** o **REQUIERE FIXES** (qué falta,
   por gate). Si el gate `receipt` lista ficheros «ajenos al change», menciónalos sin tocarlos. Después,
   **para**.
7. Recuerda el paso posterior al merge: `./vsk/bin/vsk gates merge --change <id>` y
   `./vsk/bin/vsk archive <id> --apply`. El cierre administrativo (tareas, horas) es del humano.
