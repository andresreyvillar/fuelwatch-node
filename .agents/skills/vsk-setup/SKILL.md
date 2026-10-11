---
name: vsk-setup
description: Configuración inicial guiada de VSK en este proyecto (como el instalador de oh-my-zsh). Detecta el stack, hace una entrevista corta, escribe vsk/vsk.config.yaml, activa las skills y deja el proyecto listo. Usar cuando falte vsk/vsk.config.yaml, cuando el usuario diga «usa VSK», «configura VSK» o «reconfigura los gates».
---

# vsk-setup — configuración inicial

Objetivo: que el proyecto quede listo para trabajar por slices en una sola conversación, con el mínimo de
preguntas. Detecta todo lo que puedas antes de preguntar y propone respuestas por defecto.

**Reglas**
- No escribas código de producto ni specs durante el setup.
- No hagas commit. Al final los ficheros quedan para que el humano los revise.
- Pregunta en bloques cortos (3-4 preguntas cada uno). Si tu entorno tiene una herramienta de preguntas con
  opciones, úsala; si no, numera las preguntas y ofrece la respuesta por defecto entre corchetes.
- Si ya existe `vsk/vsk.config.yaml`, estás reconfigurando: lee la configuración actual, muestra
  un resumen y pregunta solo por lo que el usuario quiera cambiar.

## Paso 1 · Detectar (sin preguntar)

Recoge y resume en 5-8 líneas:
- Lenguajes: `package.json`, `tsconfig.json`, `pyproject.toml`, `requirements*.txt`, `go.mod`...
- Runner de tests y scripts: `scripts` de `package.json` (test, lint, typecheck, format), `pytest.ini`,
  `[tool.pytest]`, `[tool.ruff]`, `[tool.mypy]`, gestor de paquetes (pnpm, npm, yarn, uv, poetry) y si hay
  `.venv/`.
- Monorepo: `pnpm-workspace.yaml`, `turbo.json`, `apps/*`, `packages/*` → candidatos a `stack.surfaces`.
- Git: rama por defecto (`git symbolic-ref refs/remotes/origin/HEAD` o `main`/`develop`), remoto
  (GitHub, GitLab, Bitbucket, Azure DevOps).
- Frameworks que sugieren skills extra: NestJS (`@nestjs/core`), React/Vue/Angular/Next.
- Si ya hay `openspec/`, slices, `docs/lecciones.md` o skills previas en `.claude/skills` (un VSK
  anterior): anótalo para no pisar nada.

## Paso 2 · Entrevista

**Bloque A · Proyecto**
1. Nombre del proyecto [nombre del directorio o de `package.json`].
2. Idioma de slices, specs y lecciones [es].
3. ¿Hay glosario u ontología del dominio? Si existe, dónde; si no, se crea `openspec/glossary.md` vacío.

**Bloque B · Stack y comandos** (muestra lo detectado y pide confirmación o corrección)
4. Adaptadores: `typescript`, `python` o ambos. Para otro lenguaje se crea un adaptador desde
   `vsk/adapters/_template.yaml` (ayuda a rellenarlo).
5. Comandos: test, test con salida JUnit, typecheck, lint, format y auditoría de dependencias. Propón los
   del proyecto (por ejemplo `pnpm vitest run`, `.venv/bin/python -m pytest`) si difieren de los del
   adaptador. Comprueba que el runner puede emitir JUnit: Vitest `--reporter=junit`, pytest `--junitxml`,
   Jest necesita `jest-junit` (si no está, avisa; no instales nada sin permiso).
6. Superficies para triggers `ui`/`http` (apps del monorepo o `web`, `api`).

**Bloque C · Flujo de trabajo**
7. Rama base [detectada] y patrón de rama [`feat/{change}`].
8. ¿Activar `git-corporate-workflow` (ramas, commits y PRs corporativos de Cloud District)? [sí si el remoto
   es corporativo].
9. Gestor de tareas: ninguno o Jira (clave del proyecto). El kit no toca Jira; solo lo cita en el handoff.

**Bloque D · Gates y skills**
10. Gates opcionales: auditoría de dependencias, formato, e2e (comando y rutas `when`), captura de
    pantalla para triggers `ui`, herramienta de mutación (Stryker, mutmut) además de los zombis.
11. Seguridad: ¿el gate `security` aplica siempre [recomendado] o solo en rutas sensibles? Si es por rutas,
    pide los globs (auth, pagos, SQL, workflows de CI, secretos).
    Esas rutas son también las de `ceremony.sensitive`: un cambio que las toque no puede declararse
    trivial ni small. Añade las propias del proyecto (pagos, permisos...) a la lista por defecto.
12. Skills obligatorias extra: `nestjs-clean-typescript` (si hay NestJS), `frontend-core` (si hay frontend),
    `context-add` (si llegará material del cliente: actas, documentos, pizarras), o skills propias del
    proyecto (nombre y fase).
13. ¿Algún gate propio más? Pide `id`, fase, tipo (`command` con su comando, `skill` con su skill o
    `manual`) y si es obligatorio.

**Bloque E · Arquitectura**
14. Estilo de arquitectura. Propón el detectado (carpetas `domain/`, `application/`, `infrastructure/`,
    `ports/`, `adapters/`, `features/`, `modules/`): por capas · hexagonal (puertos y adaptadores) · DDD
    estratégico (contextos y lenguaje) · DDD estratégico y táctico (agregados, entidades, repositorios) ·
    vertical slices · sin decidir.
15. Si es **DDD o hexagonal**, propón:
    - **Capability = módulo.** Lista las capabilities iniciales (los bounded contexts) con su ruta, para
      que la regla «nunca tocar módulos fuera de `specs[]`» se pueda comprobar.
    - **Gate de dependencias** en la fase refactor, con `run: "@deps"`:
      - TypeScript: dependency-cruiser (`depcruise src --config .dependency-cruiser.cjs`) con dos reglas:
        el dominio no importa infraestructura, adaptadores ni frameworks; un contexto solo importa la API
        pública de otro (su `index.ts`), nunca sus internos.
      - Python: import-linter (`lint-imports`) con un contrato `layers` (dominio → aplicación →
        infraestructura) y uno `independence` entre contextos.
      - Es una dependencia de desarrollo nueva: comprueba la versión compatible con el Node/TypeScript o el
        Python del proyecto y **pide permiso antes de instalarla**. Sin permiso, deja el gate escrito con
        `required: false` y dilo en el resumen.
    - Con DDD táctico, añade la skill propia del proyecto que recoja sus convenciones (agregados,
      repositorios, eventos de dominio) como obligatoria en implement y refactor, si el equipo la tiene.
    Si es por capas o vertical slices, ofrece el mismo gate solo con las reglas de capas [no]. Si es «sin
    decidir», anótalo y sigue: se puede decidir después con este mismo bloque.

## Paso 3 · Escribir

1. Copia `vsk/vsk.config.example.yaml` a `vsk/vsk.config.yaml` y ajústalo con las
   respuestas. Mantén los comentarios útiles. Reglas:
   - `skills.mandatory` usa la skill de clean code del adaptador (`clean-code-typescript`,
     `clean-code-python`) en `tdd`, `implement` y `refactor`, y `security-review` en `verify`.
   - Con dos adaptadores, el gate `clean-code` se duplica por lenguaje con `when` por extensión.
   - Gates propios con `id` en kebab-case; `run: "@nombre"` si reutilizan un comando.
2. Activa las opcionales elegidas: `./vsk/bin/vsk skills enable <nombre>`.
3. Crea lo que falte, sin sobrescribir: los directorios de `paths` (`openspec/slices`, `openspec/specs`,
   `openspec/changes`), `docs/lecciones.md` (cabecera y formato de entrada), `vsk/debt.txt`
   (vacío, con una línea de comentario) y `vsk/PROJECT.md` desde `PROJECT.template.md`, con lo
   aprendido en la detección (stack, entorno, restricciones que el usuario haya mencionado).
   Añade a `PROJECT.md` una sección `## Arquitectura` con el estilo elegido, el mapeo capability → módulo
   y las reglas de dependencia, para que el agente las tenga presentes en cada slice.
4. Arquitectura: escribe `vsk/architecture.yaml` con los componentes de la app (los que ya existen
   y los previstos), su capa, sus rutas (`paths`, globs) y las relaciones (`edges`). Los sistemas de fuera
   (APIs de terceros, colas, canales) van con `external: true`. Es lo que dibuja `vsk dashboard`:
   ```yaml
   title: <proyecto>
   layers: [Entrada, Dominio, Datos, Salida]
   components:
     - { id: ingesta, name: Ingesta, layer: Entrada, paths: ["src/ingesta/**"], description: "..." }
     - { id: slack, name: Canal de Slack, layer: Entrada, external: true }
   edges:
     - [slack, ingesta]
   ```
5. Ejecuta `./vsk/bin/vsk doctor` y corrige lo que falle. Los avisos de comandos que no existen
   se comentan con el usuario (por ejemplo, un proyecto sin linter).

## Paso 4 · Cerrar

Resume en una tabla: adaptadores, estilo de arquitectura, comandos, gates por fase (obligatorios y opcionales), skills obligatorias
por fase y skills opcionales activas. Después indica el siguiente paso, que es definir la ontología con la skill ontology:

> Listo. Ahora definimos la ontología: el dominio, su glosario y las primeras job stories (skill ontology).
> De ahí saldrá el primer slice. Revisa los ficheros creados antes de hacer commit.
