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
