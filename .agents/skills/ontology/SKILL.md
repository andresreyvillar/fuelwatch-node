---
name: ontology
description: Define la ontología del proyecto y su información base (vsk/ontology.yaml) siguiendo el análisis funcional de Nedgia — dominio, glosario, épicas y job stories, escenarios funcionales, eventos con sus campos y objetos valor, entidades, slices con sus reglas y necesidades de lectura, escenarios y ejemplos. Usar al iniciar un proyecto, antes del primer slice, o cuando el usuario diga «define la ontología», «empecemos por el dominio», «añade este concepto», «qué eventos hay».
---

# ontology — el lenguaje antes que el código

Principio 1 de la constitución: la ontología es configuración, no prompt. Un término que no está en el
glosario no se usa en una job story; lo que el agente proponga fuera de la ontología se descarta.

**Formato:** `vsk/ontology.yaml`. Tipos de pieza y verbos fijos: `./vsk/bin/vsk ontology meta`.
**Edición:** siempre con el harness, nunca a mano, para que cada cambio se valide y el dashboard lo dibuje:
```bash
./vsk/bin/vsk ontology init
./vsk/bin/vsk ontology add <Tipo> <id-kebab> --nombre "..." --descripcion "..." [--rel verbo=id,id] [--attr clave=valor]
./vsk/bin/vsk ontology link <origen> <verbo> <destino>
./vsk/bin/vsk ontology validate
```
Narra cada paso con `./vsk/bin/vsk step "<qué defines y por qué>" --phase propose`.

## Cómo conducir la conversación
- Una pregunta concreta cada vez, con una propuesta por defecto que el usuario pueda aceptar o corregir.
- Escribe en la ontología lo que el usuario confirma, en el momento: así lo ve aparecer en el dashboard.
- Nombres: términos y entidades en singular; eventos en pasado y PascalCase en `--nombre`
  (ResultadoPublicado); ids siempre en kebab-case (`resultado-publicado`).
- Lo no verificado se marca en `--descripcion` con `?` y se pregunta antes de seguir.

## El recorrido (orden de Nedgia)
1. **Dominio** (`Dominio`): qué área de negocio es y quién responde de ella (`Actor` + `actuaEn`).
2. **Glosario** (`Termino`): los 8-15 términos del lenguaje del negocio, con definición y «no confundir con».
   Nada de lo que viene después puede usar un término que no esté aquí.
3. **Épicas y job stories** (`Epica`, `JobStory` + `perteneceA`): cada job story en
   `--attr cuando="..." --attr quiero="..." --attr para="..."`. El *cuando* es un hecho observable y el *para*
   nombra la ganancia de negocio.
4. **Escenarios funcionales** (`EscenarioFuncional` + `especifica` → job story, `--clase feliz|error`).
   Una job story sin escenarios no pasa a diseño.
5. **Modelo** (`Entidad`, `ObjetoValor`): entidades con identidad (`tieneIdentidad` → objeto valor) y sin
   modelo de datos; objetos valor con su patrón en `--attr patron="..."`.
6. **Eventos** (`Evento`, `CampoEvento`): un evento por hecho, en pasado. Cada campo `seTipaCon` un objeto valor.
7. **Slices** (`Slice`): qué evento lo `desencadena`, qué `necesitaConocer` (`NecesidadLectura` +
   `seSatisfaceCon` eventos), qué reglas lo gobiernan (`seRigePor` → `ReglaNegocio`) y qué `publica` o
   `rechazaCon`. Si ya existe el slice de código, enlázalo con `--slice <slug>`.
8. **Escenarios y ejemplos** (`EscenarioSlice` con `--clase`, `ejemplifica`, `ejercita` reglas,
   `seIlustraCon` → `Ejemplo` con `--attr previo=... --attr desencadenante=... --attr esperado=...`).
   Cada regla necesita al menos un escenario feliz y uno de error; cada escenario, un ejemplo.

No hace falta completarlo todo en la primera sesión: basta con dominio, glosario, una épica y las job
stories del primer slice. El resto crece slice a slice.

## Cierre
1. `./vsk/bin/vsk ontology validate`: sin errores. Los avisos de completitud se comentan con el
   usuario; los que queden se convierten en tareas de los próximos slices.
2. Si la ontología revela componentes de la aplicación, propón actualizar `vsk/architecture.yaml`.
3. Resume: dominio, número de términos, job stories, eventos y slices, y el siguiente slice propuesto
   (skill vsk-propose), que nacerá de una job story y de sus escenarios.
