---
name: vsk-propose
description: Propone un slice nuevo o la modificación de uno existente (fases 0-2 de VSK) — decide el artefacto, escribe slice, deltas y change pack, deja los tests en ROJO impuesto y declara los zombis. Usar cuando el usuario describa un comportamiento nuevo, un cambio de comportamiento o un bug con cambio observable, o diga «propón un slice», «nuevo slice», «quiero que el sistema haga X».
---

# vsk-propose — fases 0 a 2

**Constitución:** `vsk/CONSTITUTION.md` §3-§7. **Reglas del proyecto:** `vsk/PROJECT.md`.
**Harness:** `./vsk/bin/vsk`.

Antes de empezar: `./vsk/bin/vsk skills mandatory propose` y `... mandatory tdd`. Carga esas
skills; sus reglas prevalecen sobre el criterio general.

**Narración para el monitor.** Antes de cada paso numerado de esta skill, cuéntalo en una frase en presente,
con el porqué si no es obvio: `./vsk/bin/vsk step "<qué haces y por qué>" --phase <fase> --change <id>`
(`--detail "..."` para una segunda línea). Quien siga la implementación con `vsk watch` ve así cada paso
junto a los gates y sus salidas. Narra hechos, no intenciones vagas: «Quito los marcadores para ver el rojo
real», no «Sigo con el trabajo».

## Fase 0 · Decidir el artefacto

1. `./vsk/bin/vsk list --json`: ¿ya hay un slice con el mismo trigger (tipo, superficie y
   detalle)? Si lo hay, **se modifica ese**; no se abre otro.
2. Clasifica: slice nuevo · modificación (menor: añade escenarios; significativa: cambia escenarios;
   estructural: cambia el trigger) · cambio suelto sin comportamiento observable (refactor, docs, infra),
   que va como change pack con `Slice: N/A` y sin fases de semáforo.
3. **Nivel de ceremonia** (constitución §7): trivial · small · standard · large. Decide con hechos:
   - ¿Cambia algo observable? Si no, y es pequeño (docs, renombrado, configuración, fix sin cambio de
     contrato) → **trivial**: change pack con `Slice: N/A`, sin semáforo ni zombis.
   - Un comportamiento en una sola capability, sin dependencias nuevas ni contrato público → **small**.
   - Varias capabilities, dependencias nuevas, cambios de API o de esquema, o diseño ambiguo → **large**
     (con `design.md` y la alternativa descartada).
   - Lo demás → **standard**. Ante la duda, el nivel superior.
   - Si toca rutas sensibles (auth, SQL, migraciones, CI, secretos, Dockerfile), el mínimo es standard.
   Decláralo en `proposal.md` (`> **Nivel:** \`small\``) y di al humano en una línea por qué ese nivel.
4. Lee el glosario/ontología del dominio. Un término que no está definido se marca `?` y se pregunta.
5. Si falta información para escribir escenarios verificables, pregunta ahora (máximo 3-4 preguntas).

## Fase 1 · Proponer

1. Esqueleto: `./vsk/bin/vsk new <slug> --capability <cap> [--kind <kind>] [--change <id>] --nivel <nivel>`.
   Un cambio trivial no usa `new`: crea `<changes>/<id>/proposal.md` con `Slice: N/A`, `Nivel: trivial`,
   `tasks.md` y `runs.yaml` (`[]`), y salta a su implementación con vsk-implement.
2. Slice (`<slices>/<cap>/<slug>.md`): frontmatter completo (ningún `?` en `trigger.type`, `actor`,
   `tests_root`), contexto con datos, un `### <slug-escenario>` por caso con **WHEN**/**THEN**.
   - Un comportamiento por escenario; resultado observable, nunca la implementación.
   - Recorre los casos: cero, uno, varios, límites, entradas inválidas, fallos de dependencias externas.
   - `specs[]` incluye todas las capabilities que cruza.
3. Deltas (`<changes>/<id>/specs/<cap>/spec.md`): un `### Requirement:` por promesa, con sus
   `#### Scenario:` y `verified-by:` (rutas de test previstas). MODIFIED/REMOVED citan el nombre exacto
   del requirement consolidado. Nunca edites `<specs>/` directamente.
4. `proposal.md`: por qué (con datos), qué cambia (ficheros), **fuera de alcance** con el motivo de cada
   punto, impacto, riesgos y seguridad. Si toca auth, datos personales, secretos, entradas externas o
   dependencias, dilo: la fase de verificación exigirá security-review.
5. `tasks.md`: plan prescriptivo; cada paso termina en su comando.
6. Arquitectura: si el slice crea un componente nuevo o una relación nueva, añádelo a
   `vsk/architecture.yaml` (con sus `paths`); aparecerá como «previsto» en `vsk dashboard` hasta
   que existan sus ficheros.
7. Gates: `./vsk/bin/vsk gates propose --change <id>`. Máximo 3 rondas de corrección.

## Fase 2 · TDD en ROJO y zombis

1. Un test (o más) por escenario, en `tests_root`, anotado:
   - Python: `# @scenarios <slug-escenario>` sobre el `def` y `@pytest.mark.xfail(strict=True, reason="rojo: <slug>")`.
   - TypeScript: `/** @scenarios <slug-escenario> */` sobre el test y `test.fails('...', ...)` (Vitest) o
     `test.failing` (Jest).
   - Si el test no vive en una carpeta `<slug>/`, añade `@slice <slug>` en la anotación.
2. El test afirma el resultado observable completo del escenario. Prohibido: aserciones sobre literales
   que el propio test introduce, «determinismo» comprobado llamando dos veces a lo mismo, tests sin
   aserción, mocks de la unidad bajo prueba. Datos sembrados que no coincidan con los de las fixtures.
3. `./vsk/bin/vsk semaforo <slug>` → todos los escenarios en **ROJO**. Un ROTO significa que el
   test pasa sin implementación (no prueba nada) o que no compila: se corrige.
4. `zombies.yaml`: al menos un zombi por escenario sobre el código de producción que se va a tocar (si aún
   no existe, anota el fichero y la mutación prevista en `why`; `find`/`replace` se completan en la
   implementación). Cada zombi nombra el comportamiento que rompe.
5. Gates: `./vsk/bin/vsk gates tdd --change <id>`.

## Handoff de la propuesta

- Registra: `./vsk/bin/vsk run add --change <id> --fase tdd --actor agente --gate validate=pass --gate coverage=pass --gate red=pass [...]`.
- Ficheros staged uno a uno (nunca `git add .`), sin commit. Pide al humano que valide escenarios, fuera de alcance y plan: es el paso de
  mayor palanca. El commit de autoría lo hace el humano.
- Resume: slice, nivel, escenarios, capabilities, riesgos y si aplicará security-review. Después, **para**:
  la siguiente fase empieza cuando el humano valida.
