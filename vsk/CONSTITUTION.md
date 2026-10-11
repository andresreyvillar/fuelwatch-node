# Constitución de VSK

Protocolo común para desarrollar con agentes (Claude Code, Codex) por slices verticales. Este documento
lo gestiona el kit y no se edita en el proyecto: las reglas propias van en `vsk/PROJECT.md` y la
configuración en `vsk/vsk.config.yaml`. Si algo de aquí contradice otra instrucción de proceso,
manda este documento.

Palabras clave: **DEBE** = un gate lo comprueba · **NUNCA** = bloquea · **PUEDE** = decisión del equipo.

---

## 1. Principios

1. **Ontología primero.** El vocabulario del dominio (glosario, ontología) es configuración, no prompt.
   Un término sin definir se marca `?` y no se especifica hasta resolverlo.
2. **El slice es la unidad.** Un slice es un comportamiento observable, de la entrada del usuario a los
   datos, entregable por sí solo.
3. **El contrato tiene tres capas.** Slice (escenarios) → requirements de la capability (deltas) → tests
   anotados. Los deltas son el contrato; el código es una derivada demostrada por tests.
4. **Tests antes que código, con semáforo.** Rojo impuesto por la herramienta → rojo real → verde → ámbar
   (refactor) → verde. Cada luz la comprueba el harness, no la disciplina.
5. **Pruebas zombi.** Un test solo vale si cae cuando el comportamiento se rompe: se demuestra sembrando
   un zombi y viendo caer exactamente su test.
6. **Gates automáticos y configurables.** Nada avanza de fase con un gate obligatorio sin pasar. Máximo
   `retries` intentos (3 por defecto) por gate; después se escala al humano.
7. **El humano decide en dos puntos.** Valida la propuesta antes de escribir código y decide el commit y
   el merge. El agente NUNCA hace commit, push, merge ni despliegue.
8. **El sistema aprende.** Cada fallo con causa raíz se convierte en regla, en el punto más fuerte posible.

## 2. Vocabulario del método

| Término | Qué es | Dónde vive |
|---|---|---|
| Contexto | Material de entrada (cliente, equipo, mediciones) con jerarquía de verdad | `docs/context/` (skill context-add) |
| Capability | Dominio del sistema con su spec consolidada | `<specs>/<cap>/spec.md` |
| Slice | Comportamiento observable con escenarios WHEN/THEN | `<slices>/<cap>/<slug>.md` |
| Escenario | Un caso del slice, con slug propio | `### <slug>` dentro del slice |
| Change pack | La propuesta de cambio de un slice | `<changes>/<id>/` |
| Nivel | Tamaño del cambio, que decide la ceremonia: trivial, small, standard o large | `> **Nivel:**` en `proposal.md` |
| Recibo | Cierre del change pack en 300 palabras como máximo: veredicto, ficheros, comprobaciones, pendientes | `<changes>/<id>/receipt.md` |
| Delta | Requirements añadidos, modificados o eliminados | `<changes>/<id>/specs/<cap>/spec.md` |
| Test | Prueba anotada con los escenarios que demuestra | `@scenarios <slug>` |
| Zombi | Mutación controlada que debe hacer caer un test concreto | `<changes>/<id>/zombies.yaml` |
| Gate | Comprobación obligatoria de una fase | `vsk.config.yaml` → `gates` |
| Run | Registro de una ejecución y sus gates | `<changes>/<id>/runs.yaml` |
| Lección | Regla nacida de un fallo, con su evidencia y su confianza | `vsk/lessons.yaml` (y su relato en `paths.lessons`) |
| Deuda | Excepción declarada que solo puede decrecer | `paths.debt` |

Las rutas `<slices>`, `<specs>` y `<changes>` salen de `paths` en la configuración.

## 3. Anatomía del slice

Frontmatter obligatorio: `slice` (= nombre del fichero), `status` (proposed | shipped | deprecated |
blocked, solo avanza), `kind` (action | reaction | scheduled | maintenance | failure), `actor`,
`trigger {type: ui|http|event|cron|command, surface, detail}`, `events {emits, consumes}`, `specs[]`
(todas las capabilities que cruza), `tests_root`, `blocked`.

Cuerpo: título, `## Contexto`, `## Comportamiento observable` con un `### <slug-escenario>` por caso y
líneas **WHEN** / **THEN**, `## Estado después`, `## Edge cases`, `## Fuera de alcance`.

Redacción: presente atemporal, un comportamiento por escenario, resultado observable (nunca la
implementación), sin nombres de personas ni fechas relativas. Los datos no verificados se marcan `?`.

Colisión: un trigger que ya tiene slice NO abre otro; se modifica el existente (`vsk list`).

## 4. Change pack

```
<changes>/<id>/
  proposal.md      por qué · qué cambia · fuera de alcance (obligatorio, con motivos) · impacto · riesgos
  tasks.md         plan numerado; cada paso cierra con su comando en verde
  design.md        opcional: decisiones y la alternativa descartada
  specs/<cap>/spec.md   deltas ## ADDED | MODIFIED | REMOVED Requirements, con verified-by:
  zombies.yaml     al menos un zombi por escenario
  runs.yaml        registro de ejecuciones (solo con `vsk run add`)
  receipt.md       recibo del handoff (plantilla en vsk/templates/receipt.md)
```

`proposal.md` DEBE citar su slice con `> **Slice:** \`<slug>\`` (o `Slice: N/A`) y su nivel con
`> **Nivel:** \`<nivel>\``. El id del change sigue
`feat-|fix-|refactor-|docs-<slug>`. Las specs consolidadas NUNCA se editan fuera del archive.

## 5. El semáforo TDD

| Luz | Qué significa | Cómo lo comprueba el harness |
|---|---|---|
| ROJO | Rojo impuesto: el test existe con el marcador de rojo del adaptador | la suite pasa porque la herramienta invierte el resultado; si el test pasa antes de tiempo, la suite falla |
| ROJO REAL | Sin marcador, el test falla | tras quitar el marcador y antes de implementar |
| VERDE | Sin marcador, el test pasa | todos los escenarios verdes |
| ÁMBAR | Todo verde pero el refactor no ha terminado | algún gate de la fase `refactor` sin pasar |

Marcadores por adaptador: Python `@pytest.mark.xfail(strict=True, reason="rojo: <slug>")` · TypeScript
`test.fails(...)` (Vitest) o `test.failing(...)` (Jest). Un `skip`, `todo`, `fixme` o `xfail` sin
`strict` es un **pendiente**: NUNCA vale como rojo y NUNCA sobrevive al merge (gate `no-pending`).

Secuencia obligatoria: escribir tests en ROJO → validar la propuesta → quitar marcadores y **ver el ROJO
REAL** (si un test pasa sin implementación, no prueba lo que dice: se corrige antes de seguir) →
implementar hasta VERDE → zombis → refactor hasta salir de ÁMBAR. Comando: `vsk semaforo <slug>`.

Está PROHIBIDO debilitar, vaciar o borrar un test para ponerlo verde. Si un test estaba mal, se corrige en
el mismo change pack y se declara en el run.

## 6. Pruebas zombi

Un zombi es una mutación controlada del código de producción que rompe un escenario concreto.

1. Se declara en `zombies.yaml`: `scenario`, `file`, `find` (texto que aparece una sola vez), `replace`,
   `expect` (escenarios cuyo test debe caer; por defecto el propio) y `why` (qué comportamiento cambia).
2. `vsk zombie <change>` comprueba la línea base en verde, siembra cada zombi, ejecuta la suite y exige
   que caiga **exactamente** el test esperado: ni menos (el zombi sobrevive) ni otros (daño colateral).
   Después lo retira y exige que la suite vuelva a verde.
3. Reglas:
   - Al menos un zombi por escenario. Un zombi muta producción, NUNCA un test.
   - Antes de sembrarlo se nombra el comportamiento observable que cambia (`why`).
   - Un error de compilación o de arranque no es una caza: el resultado es INCIERTO.
   - Un zombi equivalente (no cambia el comportamiento) se corrige a él, no al test.
   - «Todos cazados» no prueba eficacia si los zombis los eligió quien implementó y solo tocan lo obvio:
     el verificador PUEDE añadir los suyos.
4. Los zombis son la versión dirigida del mutation testing y se ejecutan en la fase `implement`. Una
   herramienta de mutación (Stryker, mutmut) PUEDE añadirse como gate `command` adicional.

## 7. Protocolo por fases

Cada fase termina con `vsk gates <fase> --change <id>` en verde. Los gates de cada fase y las skills
obligatorias salen de la configuración (`vsk skills mandatory <fase>`): el agente DEBE cargarlas al entrar
en la fase y sus reglas prevalecen sobre el conocimiento general.

| Fase | Quién | Qué | Skill |
|---|---|---|---|
| 0 · Decidir | agente | ¿slice nuevo, modificar uno existente o cambio suelto sin slice? | vsk-propose |
| 1 · Proponer | agente | slice, deltas, proposal, tasks | vsk-propose |
| 2 · TDD rojo | agente | un test por escenario en ROJO, zombis declarados | vsk-propose |
| — · Validar | **humano** | escenarios, fuera de alcance y plan; commit de autoría | — |
| 3 · Implementar | agente | rama, ROJO REAL, VERDE, zombis | vsk-implement |
| 4 · Refactor | agente | ÁMBAR → VERDE con la skill de clean code | vsk-implement |
| 5 · Verificar | verificador | trazabilidad, adversarial, seguridad, docs | vsk-implement |
| 6 · Handoff | agente | evidencia registrada, recibo, ficheros del recibo staged, veredicto | vsk-implement |
| — · Commit y merge | **humano** | revisa, hace commit, abre PR/MR y mergea | — |
| 7 · Archivar | herramienta | `vsk archive <id> --apply`: deltas a specs, slice a shipped; el humano commitea el resultado antes del siguiente slice (si no, `specs-untouched` lo bloquea) | — |
| 8 · Auditar | agente | inventario contra la constitución | vsk-audit |

Veredicto final del handoff, obligatorio: `LISTO PARA COMMIT` (todos los gates obligatorios en verde) o
`REQUIERE FIXES` (lista por gate de lo que falta).

### Niveles de ceremonia

La ceremonia se ajusta al tamaño del cambio. El agente clasifica el cambio en la fase 0 y lo declara en
`proposal.md`; el gate `ceremony` valida la declaración y el harness omite los gates que el nivel no exige
(aparecen como «omitido por nivel», nunca en verde).

| Nivel | Cuándo | Qué cambia |
|---|---|---|
| trivial | sin comportamiento observable: renombrar, docs, configuración, un fix de una línea sin cambio de contrato | sin slice (`Slice: N/A`), sin semáforo ni zombis; solo los checks del proyecto y el recibo |
| small | un comportamiento acotado en una capability, sin dependencias nuevas ni cambios de contrato público | ciclo completo con un solo verificador adversarial |
| standard | lo normal; el nivel por defecto | ciclo completo |
| large | varias capabilities, dependencias nuevas, cambios de API o de esquema, diseño ambiguo | ciclo completo y `design.md` obligatorio con la alternativa descartada |

Si el cambio toca una ruta sensible (`ceremony.sensitive`: auth, SQL, migraciones, CI, secretos, Dockerfile), el
nivel mínimo es `ceremony.min_sensitive` (standard por defecto), aunque el cambio sea pequeño. Ante la duda,
el nivel superior.

### Reglas del trabajador

1. **Una tarea, un change pack, y parar.** Al cerrar el handoff no se empieza otro trabajo por iniciativa
   propia.
2. **Si está bloqueado, lo dice y para.** Escribe exactamente qué necesita y de quién; NUNCA espera en
   bucle, reintenta a ciegas ni rodea el bloqueo.
3. **Sin teatro de proceso.** Nada de informes sobre informes ni de revisar el propio trabajo como si fuera
   otro (los gates de verificación los hace otro); los subagentes solo para los gates que los piden.
4. **El recibo cierra.** El último mensaje del handoff es el recibo (`receipt.md`, 300 palabras como
   máximo): veredicto, ficheros cambiados, comprobaciones con su resultado y lo que queda pendiente con
   quién lo desbloquea. El gate `receipt` comprueba la longitud, que el veredicto coincide con el último
   resultado de los gates y que lo staged es exactamente la lista del recibo.

## 8. Gates

Los gates son configuración (`vsk.config.yaml` → `gates`). Tipos: `builtin` (harness), `command`
(shell, pasa con código 0), `skill` y `manual` (evidencia registrada en `runs.yaml`). Cada gate tiene
`phase`, puede tener `when` (globs sobre los ficheros cambiados; si no coincide, se omite) y `required`.

Añadir un gate o una skill obligatoria:
```yaml
gates:
  - { id: e2e, type: command, phase: verify, run: "pnpm playwright test", when: ["apps/web/**"] }
  - { id: nestjs, type: skill, phase: refactor, skill: nestjs-clean-typescript, when: ["apps/api/**"] }
skills:
  mandatory:
    implement: [clean-code-typescript, mi-skill-propia]
```

Reglas:
- **Quien implementa no verifica.** Los gates `adversarial`, `security` y `traceability` los ejecuta un
  subagente o una persona sin el contexto de la implementación. En Claude Code son los agentes del kit
  `vsk-verifier`, `vsk-security` y `vsk-tracer` (`.claude/agents/`): no pueden editar ficheros y su modelo se
  fija en `agents:` de la configuración.
- Los nombres de gate en `runs.yaml` DEBEN existir en la configuración (`vsk run add` lo valida).
- Un rojo de red, puertos o entorno es INCIERTO, no un fallo del producto: se aísla y se repite.
- Máximo `retries` intentos por gate; al agotarlos, parar, informar y ejecutar `/leccion`.

### Adversarial
Lanzar 2 o 3 subagentes independientes, sin el contexto de la implementación, con el encargo: *«Intenta
REFUTAR que el escenario <WHEN/THEN> se cumple en este código»*. Una refutación sostenida devuelve a la
fase 3.

### Seguridad
Skill `security-review`. Cada hallazgo corregido se cierra con **prueba de explotación**: el vector de
ataque ejecutado contra el sistema arreglado (debe fallar) y el uso legítimo (debe seguir funcionando). Las
dos órdenes y su salida van al informe. Un control que solo existe en la interfaz se declara cosmético.

## 9. Reglas transversales

- NUNCA commit, push, merge ni despliegue automático. El handoff deja los ficheros staged.
- Al índice solo se añaden, uno a uno, los ficheros del recibo. NUNCA `git add .`, `-A`, `--all`, `-u`,
  directorios ni comodines: en la carpeta puede haber ficheros de otras fuentes que no deben subirse.
- NUNCA comandos que descarten trabajo ajeno: `git clean`, `git reset --hard`, `git checkout -- .`,
  `git restore .`, `git stash` sin que el humano lo pida.
- En Claude Code, estas reglas las aplica el hook de VSK (`vsk hooks status`): `git-guard` bloquea los comandos
  git prohibidos, `config-protection` impide editar la configuración de calidad durante un change pack (y
  siempre los ficheros del kit, `.claude/settings.json` y las specs consolidadas) y `gateguard` pide hechos
  (quién importa el fichero, qué API cambia, qué escenario lo pide) antes de la primera edición de cada
  fichero. Perfil con `VSK_HOOK_PROFILE=minimal|standard|strict`; desactivar uno, `VSK_DISABLED_HOOKS=id`.
  Un hook bloqueado no se rodea: se cumple lo que pide o se pregunta a la persona.
- NUNCA editar las specs consolidadas ni este documento durante un change.
- NUNCA tocar módulos fuera de las capabilities de `specs[]` del slice.
- NUNCA escrituras exploratorias contra datos de producción ni datos personales reales en fixtures.
- Todo cambio tiene un «fuera de alcance» explícito.
- Nada de reloj, aleatoriedad ni red ambiental en los tests: se inyectan.

## 10. Observabilidad

Cada comando del harness y cada paso narrado por las skills (`vsk step`) se registran en
`<changes>/<id>/events.jsonl`, que se archiva con el change. `vsk watch` muestra la implementación en vivo
(fases, paso actual, gates con su salida y duración, semáforo, zombis y una explicación de cada gate) y
`vsk watch <id> --replay --speed 4` la repite para formación. `--plain` da un log narrado línea a línea.
En Claude Code, el hook Stop añade al registro el consumo de cada turno (tokens por modelo, del agente
principal y de sus subagentes); `vsk metrics` y el dashboard lo suman por change pack y estiman el coste si
la configuración tiene `prices`. El registro es de solo añadir: NUNCA se edita a mano.

## 11. El sistema aprende

**Bucle error→regla** (skill `leccion`): cada fallo con causa raíz se codifica en el punto más fuerte
posible, en este orden: mecánico (gate o test) > protocolo (`PROJECT.md`) > skill > instrucciones del
agente. Se registra como instinct con `vsk lesson add` (`vsk/lessons.yaml`: cuándo aplica, regla, nivel,
dónde, estado y evidencias) y se narra en `paths.lessons`. La confianza se deriva de la evidencia (0,3 la
primera vez, +0,15 por cada repetición, +0,2 si está codificada como mecanismo; máximo 0,9) y NUNCA se
escribe a mano. Una misma regla reutiliza su id. `vsk lesson promote` la comparte entre proyectos; vista en
dos o más, es candidata a mejora del kit. Una skill creada por una lección declara su procedencia en
`metadata`.

**Deuda declarada** (`paths.debt`): una línea por excepción aceptada, con motivo. La lista solo decrece.

## 12. Personalización

| Qué | Dónde | ¿Lo pisa el upgrade? |
|---|---|---|
| Stack, comandos, gates, skills obligatorias | `vsk/vsk.config.yaml` | no |
| Reglas propias del proyecto | `vsk/PROJECT.md` | no |
| Adaptador de un lenguaje nuevo | `vsk/adapters/<id>.yaml` (desde `_template.yaml`) | no |
| Skills propias | `.agents/skills/<nombre>/` con nombre distinto a las del kit | no |
| Constitución, adaptadores del kit, plantillas, harness, skills del kit | kit | sí |
