# Lecciones

Reglas nacidas de fallos (skill `leccion`). Cada entrada sigue este formato:

```markdown
## <título corto de la regla>
- **Qué pasó:** hechos, con el change pack o el gate afectado.
- **Causa raíz:** una o dos frases.
- **Regla:** la regla tal cual.
- **Codificada en:** gate `<id>` · `PROJECT.md` §… · skill `<nombre>` · AGENTS.md
- **Estado:** codificada | pendiente
```

## La base del setup se commitea antes del primer slice
- **Instinct:** `setup-commiteado-antes-del-primer-slice`
- **Qué pasó:** en el change `estadistica-zona-4-carburantes`, el gate `specs-untouched` falló por
  `openspec/specs/.gitkeep`, creado por el setup y sin trackear. Se resolvió con el commit base `70c6d3b`.
- **Causa raíz:** `vsk-setup` deja los ficheros sin commitear para revisión y ningún control entre el setup
  y el primer slice exige que la base esté commiteada.
- **Regla:** la base del setup (vsk/, openspec/ con sus .gitkeep, skills, agentes y hooks) DEBE estar
  commiteada antes de vsk-propose, porque specs-untouched trata lo no trackeado bajo openspec/specs como
  specs consolidadas modificadas.
- **Codificada en:** `PROJECT.md` §Reglas nacidas de lecciones. Mejora del kit propuesta: que `vsk doctor`
  avise de ficheros del kit sin commitear (nivel mecánico).
- **Estado:** codificada

## El doble de Supabase debe ser tan estricto como PostgREST
- **Instinct:** `falso-supabase-tan-estricto-como-postgrest`
- **Qué pasó:** en `busqueda-por-provincia`, el verificador adversarial refutó `sugerencias-incluyen-provincia`: `GET /api/suggestions?q=coruña (a)` respondía 500 en producción («LIKE pattern must not end with escape character») mientras los tests pasaban con el Supabase falso, que aceptaba el escape `\(` dentro de `.or()`.
- **Causa raíz:** el doble era más permisivo que el servidor real, y el texto del usuario entraba en `.or()` escapado con barra invertida en lugar de entre comillas.
- **Regla:** El falso de Supabase DEBE rechazar lo que PostgREST rechaza (en `.or()`, valores con caracteres reservados sin comillas) y el texto del usuario en `.or()` DEBE ir entre comillas con `quoteFilterValue()`, porque un doble más permisivo que el servidor deja en verde consultas que fallan en producción.
- **Codificada en:** `frontend_astro/tests/support/fake-supabase.ts` (`parseOrValue`) · `PROJECT.md` §Reglas nacidas de lecciones
- **Estado:** codificada (pendiente aplicar a `getSearchConditions()` en el slice de seguridad)
