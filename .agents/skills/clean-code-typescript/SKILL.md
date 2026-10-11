---
name: clean-code-typescript
description: Clean code y buenas prácticas de TypeScript/JavaScript para VSK — reglas de Robert C. Martin adaptadas (naming, funciones, clases, errores, comentarios, smells) más las prácticas corporativas de TypeScript (tipado estricto, inmutabilidad, uniones discriminadas), y cómo diseñar tests que cacen zombis. Obligatoria en las fases tdd, implement y refactor de proyectos TS/JS; también para revisar o refactorizar código TypeScript.
---

# clean-code-typescript

## Regla crítica: references primero
Antes de escribir, revisar o refactorizar, carga los `references/<tema>/rules.md` (y `examples.md` si hay
dudas) que tocan la tarea. Prevalecen sobre el conocimiento general. Al recomendar algo, cita la regla
(«según `references/functions/rules.md`: una función hace una sola cosa»). Índice completo: `guidelines.md`.

## Qué cargar en cada fase de VSK

| Fase | Cargar | Para qué |
|---|---|---|
| tdd | `references/tdd`, `references/unit-tests`, `references/testing-strategies`, `workflows/tdd.md` | tests que demuestran el escenario y cazan su zombi |
| implement | `references/naming`, `functions`, `error-handling`, `smells`, `practices.md`; `workflows/new-feature.md` o `bug-fix.md` | código mínimo hasta verde, sin deuda nueva |
| refactor | `references/classes`, `comments`, `formatting`, `coding-practices`, `smells`; `workflows/refactoring/` | salir del ámbar con los tests en verde |
| verify | `workflows/code-review/`, `workflows/pr-review/`; `references/smells` como catálogo de refutaciones | revisión adversarial |

## Tests que cazan zombis
- Un test por comportamiento observable del escenario; nombre que lo describe.
- Afirma el resultado completo (valor, estado, efecto), no un detalle incidental.
- Nada de aserciones sobre literales que el propio test introduce, ni de «determinismo» llamando dos
  veces a lo mismo, ni de mocks de la unidad bajo prueba.
- Reloj, aleatoriedad y red se inyectan. Un servicio caído se simula con un servidor efímero en puerto 0,
  nunca con un puerto fijo cerrado.
- Si sustituyes la única costura con el exterior (cliente HTTP, driver), al menos un test ejerce el camino
  real contra un servidor local de mentira: si no, un zombi dentro de la costura sobrevive.

## TypeScript en una página (`practices.md` para el detalle)
- Prohibido `any`: `unknown` y estrechamiento de tipos. Tipos de retorno explícitos en funciones públicas.
- Uniones de literales mejor que `enum`; uniones discriminadas y `switch` exhaustivo con `never`.
- Inmutabilidad por defecto (`const`, `readonly`); métodos declarativos de array.
- Errores: tipos resultado o errores propios con causa; nunca tragar excepciones.
- Nombres verbo + sustantivo; si el nombre necesita «y», son dos funciones.
- Sin dependencias circulares; imports y exports coherentes en todo el proyecto.

## Registro del gate
Tras revisar el diff del change pack con estas reglas y corregir lo encontrado:
`./vsk/bin/vsk run add --change <id> --fase refactor --actor agente --gate clean-code=pass`.

Origen: skill `typescript-clean-code` (BMAD Labs, licencia MIT en `LICENSE`) y `typescript-good-practices`
del repositorio corporativo de skills de Cloud District.
