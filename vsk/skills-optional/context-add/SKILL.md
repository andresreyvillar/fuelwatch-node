---
name: context-add
description: Ingesta de contexto al proyecto (opcional de VSK) — actas y transcripciones de reunión, documentos del cliente, hilos, pizarras, notas o datos medidos. Pipeline ficha → tabla de destilado a validar → brief por tema → INDEX → propuesta de canonización (slice, glosario, decisión). Usar cuando el usuario aporte material nuevo («mete esta reunión», «ingesta este documento», ficheros en docs/context/inbox/).
---

# context-add — del material crudo al contexto destilado

**Principio:** el contexto crudo NUNCA llega a un slice; solo lo destilado y canonizado.
**Modelo:** `docs/context/INDEX.md` (jerarquía de verdad y convenciones). Si no existe, créalo desde
`references/INDEX.template.md` y crea `docs/context/{inbox,sources,briefs}/`.

## Jerarquía de verdad
cliente > equipo > medición > inferencia. Una medición sobre datos reales puede corregir una decisión de
diseño; una inferencia nunca corrige a una fuente de más rango.

## Entradas
Fichero (ruta o todo `docs/context/inbox/`), texto pegado («nota: ...»), transcripción con marcas de tiempo,
o una medición (consulta exacta y resultado).

## Pipeline (por pieza)
1. **Ficha** → `docs/context/sources/<AAAA-MM-DD>-<slug>.md` desde `references/ficha.template.md`. Infiere
   tipo, fecha y capabilities; pregunta solo lo que no se puede inferir (normalmente la autoridad: ¿decisión
   o opinión?). De una conversación se extraen decisiones, propuestas y objeciones; nunca se vuelca entera.
2. **Destilado** → tabla de validación, el ÚNICO punto de decisión humana. Presenta la tabla antes de
   escribir nada más:

   | Afirmación | Clasificación |
   |---|---|
   | cambia un comportamiento observable | candidato a slice (escenario o requirement) |
   | explica un porqué con alternativas | decisión (ADR) |
   | define un término del dominio | glosario u ontología |
   | es forma de trabajar | `vsk/PROJECT.md` o una skill |
   | contexto útil de fondo | brief |
   | no afecta al producto | paja (queda en la ficha como no destilado) |

3. **Brief** → `docs/context/briefs/<tema>.md`: por tema, no por fuente (si existe, se actualiza). Una o dos
   páginas, presente atemporal, cada afirmación cita su ficha. Lo que una fuente nueva contradice se marca
   `superseded` y se explica.
4. **INDEX** → fila en Fuentes (y en Briefs si hay uno nuevo) con estado y capabilities.
5. **Canonización** (se propone, nunca se ejecuta en caliente): slices con `vsk-propose`, términos al
   glosario, decisiones como ADR. El usuario decide.

## Guardarraíles
- Nunca borrar material: la paja se declara en la ficha.
- Privacidad: se registran decisiones, no conversaciones personales; sin datos sensibles ni capturas con
  información de terceros; sin citas literales innecesarias.
- Nunca editar las specs consolidadas desde esta skill.
