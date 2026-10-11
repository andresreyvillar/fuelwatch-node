---
name: leccion
description: Bucle error→regla de VSK — convierte un fallo de proceso, un error del agente, un gate agotado o un hallazgo de revisión en una regla permanente, codificada en el punto más fuerte posible, y la registra en el fichero de lecciones. Usar cuando un gate falla con causa raíz, se agotan los 3 intentos, el usuario corrige al agente o dice «apunta esto», «que no vuelva a pasar», «lección».
---

# leccion — del error a la regla

Un fallo que solo deja un arreglo se repite. Esta skill lo convierte en una regla que lo impide.

## 1. Causa raíz
Cinco porqués breves. Separa el síntoma (lo que se vio) de la causa (lo que lo permitió). Si la causa es
«el agente no lo sabía», pregúntate qué mecanismo habría hecho imposible no saberlo.

## 2. Nivel de codificación (el más fuerte posible)
1. **Mecánico:** un gate nuevo en `vsk.config.yaml`, un test del proyecto, un check del harness, un hook.
   Siempre que se pueda comprobar con una orden, va aquí.
2. **Protocolo:** una regla en `vsk/PROJECT.md` (nunca en la constitución, que es del kit; si la
   regla vale para todos los proyectos, propónla como mejora del kit).
3. **Skill:** una instrucción en la skill que debió evitarlo (skill del proyecto, o propuesta al kit si es
   una skill del kit).
4. **Instrucciones del agente:** `AGENTS.md`, fuera del bloque gestionado por el kit. Último recurso.

## 3. Redactar la regla
Atemporal, accionable y comprobable: «X DEBE / NUNCA Y, porque Z». Sin nombres de personas ni fechas
relativas. Si no se puede decir cómo se comprueba, no es una regla todavía.

## 4. ¿Ya existe?
Antes de crear una lección, busca si ya hay una con la misma regla:
`./vsk/bin/vsk lesson list` (este proyecto) y `./vsk/bin/vsk lesson global` (otros proyectos). Si existe,
**reutiliza su id**: la nueva vez se suma como evidencia y sube su confianza. Dos ids para la misma regla
dividen la evidencia y la lección nunca madura.

## 5. Registrar
1. La lección como instinct (`vsk/lessons.yaml`; la confianza la calcula el harness a partir de la evidencia):
   ```bash
   ./vsk/bin/vsk lesson add <id-kebab> --cuando "<situación en que aplica>" --regla "<X DEBE / NUNCA Y, porque Z>" \
     --nivel mecanico|protocolo|skill|agente --donde "gate:<id> | PROJECT.md §… | skill:<nombre> | AGENTS.md" \
     --estado codificada|pendiente --evidencia "<qué pasó>" --change <id>
   ```
   Una lección que ya existe solo necesita `--evidencia` (y `--estado`/`--donde` si cambian).
2. La narración, en el fichero `paths.lessons` (por defecto `docs/lecciones.md`):
   ```markdown
   ## <título corto de la regla>
   - **Instinct:** `<id>`
   - **Qué pasó:** hechos, con el change pack o el gate afectado.
   - **Causa raíz:** una o dos frases.
   - **Regla:** la regla tal cual.
   - **Codificada en:** gate `<id>` · `PROJECT.md` §… · skill `<nombre>` · AGENTS.md
   - **Estado:** codificada | pendiente
   ```
3. Si el fallo vino de un run, cita el id en las `notas` del siguiente `vsk run add`.

## 6. Compartir entre proyectos
Si la regla no depende de este proyecto (vale para cualquier proyecto con el mismo stack o el mismo método),
`./vsk/bin/vsk lesson promote <id>` la copia a `~/.vsk/instincts.yaml`. Cuando una lección está promovida
desde dos o más proyectos, el harness la marca como **candidata a mejora del kit**: díselo a la persona; la
mejora (constitución, skill o gate del kit) se propone en el repositorio del kit, nunca editando aquí los
ficheros del kit.

## 7. Procedencia
Si la regla se codifica creando una skill nueva del proyecto, su frontmatter lleva de dónde viene:
```yaml
metadata:
  origen: leccion
  leccion: <id>
  evidencia: <change pack o run>
  confianza: <la de vsk lesson list>
```
Una skill sin procedencia no se sabe por qué existe ni cuándo puede retirarse.
