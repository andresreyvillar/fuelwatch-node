---
name: vsk-audit
description: Audita el inventario de slices y change packs contra la constitución de VSK (solo lectura) — esquema, cobertura, pendientes que sobreviven, change packs abandonados, runs inválidos, lecciones pendientes y deuda. Usar antes de una limpieza, tras un lote de slices nuevos, antes de una release o cuando el usuario pida «audita los slices».
---

# vsk-audit — auditoría de solo lectura

No modifica nada. Produce una tabla de hallazgos FALLA / AVISO con la acción propuesta para cada uno.

1. `./vsk/bin/vsk doctor` — instalación y configuración.
2. `./vsk/bin/vsk validate --json` — esquema de todos los slices.
3. Por cada slice:
   - `vsk coverage <slug> --json`: escenarios sin test → FALLA; tests que citan escenarios inexistentes → AVISO.
   - `shipped` con tests marcados (rojo o pendiente) → FALLA: un pendiente ha sobrevivido al merge.
   - `specs[]` con una sola capability pero escenarios que tocan otras → AVISO (probable multi-spec).
   - Triggers `ui`/`http` en superficies fuera de `stack.surfaces` → FALLA.
4. Por cada change pack activo (`vsk status`):
   - Sin `Slice:` en `proposal.md` (y sin `Slice: N/A`) → FALLA.
   - `vsk gates runs-schema`-equivalente: `runs.yaml` inválido → FALLA.
   - Sin runs en más de 14 días → AVISO (¿abandonado?).
   - `zombies.yaml` incompleto para su slice → AVISO.
5. Métricas: `./vsk/bin/vsk metrics` — primera pasada, gates que más fallan, zombis sobrevivientes,
   refutaciones sostenidas. Un gate que falla en más del 30 % de los runs merece una lección.
6. Lecciones: `vsk lesson list --json` con estado `pendiente` → AVISO con la regla propuesta; las de
   confianza ≥ 0,7 que siguen en nivel `agente` o `skill` → AVISO (¿se pueden codificar como mecanismo?);
   entradas de `paths.lessons` sin **Instinct** → AVISO; skills propias creadas por `leccion` sin
   `metadata.origen` → AVISO. `vsk lesson global`: candidatas a mejora del kit → mencionarlas.
7. Deuda (`paths.debt`): compara con la auditoría anterior si existe; si crece → FALLA.
8. Tests del proyecto en verde (`commands.test`) → si no, FALLA.

Salida: tabla `nivel | ámbito | hallazgo | acción`, y un resumen de tres líneas con lo más urgente.
