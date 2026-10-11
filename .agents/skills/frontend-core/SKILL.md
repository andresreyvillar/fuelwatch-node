---
name: frontend-core
description: Define los principios de desarrollo frontend respecto al diseño visual, arquitectura de componentes, accesibilidad y rendimiento para aplicaciones web. Estas reglas son universales y deben aplicarse independientemente del framework utilizado.
---

### UX y Diseño Responsivo
* **Estrategia Mobile First:**
    * Desarrollar pensando primero en dispositivos móviles y escalar progresivamente salvo que se indique lo contrario.
    * **Breakpoints:** El diseño debe adaptarse fluidamente a al menos 3 saltos: **Móvil, Tablet y Desktop**.
* **Feedback y Estabilidad Visual:**
    * **Placeholders (Skeletons):** No está recomendado el uso de spinners de página completa. Usar Skeletons que imiten la estructura final para reducir la carga cognitiva.
    * **Evitar Saltos (CLS):** Reservar siempre espacio para imágenes, vídeos o iframes (aspect-ratio o width/height fijos) para evitar que el contenido "baile" o se desplace mientras carga.

### Arquitectura de Componentes
* **Metodología:** Recomendamos **Atomic Design** para organizar componentes visuales.
* **Abstracción y Reusabilidad:**
    * **Regla de Extracción:** No duplicar conjuntos de clases o estilos repetidamente. Si un patrón visual se repite, **extraerlo a un componente** o a una clase de utilidad común.
    * **Responsabilidad Única:** Componentes con una sola responsabilidad.
    * **Tamaño:** Regla general: **< 100 líneas**. Si crece más, divídelo.
* **Gestión del Estado:**
    * **Colocación (Co-location):** Mantén el estado lo más cerca posible de donde se consume. No subir todo al estado global si solo lo necesita un componente y sus hijos.
* **Legibilidad:**
    * Priorizar la legibilidad del código frente a micro-optimizaciones visuales o "trucos" de CSS difíciles de mantener.
* **Atomicidad:** Separar Lógica, Estilos y Presentación.
* **Nombres:** Nombres basados en la funcionalidad (`UserCard`), no en la apariencia (`BigWhiteBox`).

### Accesibilidad
- Elementos interactivos deben usar HTML semántico (`button`, `a`, `input`)
- Prohibido `div` o `span` con `onClick`
- Prohibida la "sopa de divs", usar `<main>`, `<nav>`, `<article>`, `<button>` para acciones.
- Botones solo con icono deben tener `aria-label`
- Inputs deben tener `<label>` o `aria-label`
- Inputs con `value` deben tener `onChange`
- Inputs sin `name` es error
- Imágenes deben tener `alt` (o `alt=""` si decorativas)
- Iconos decorativos deben usar `aria-hidden="true"`
- Elementos interactivos deben ser accesibles por teclado
- No eliminar `outline` sin alternativa visible (`:focus-visible`)
- Al abrir elementos superpuestos (Modales, Menús laterales), el foco debe quedar "atrapado" dentro de ellos. Al cerrarlos, el foco debe volver automáticamente al elemento que disparó la acción.
- Labels deben ser clicables (`htmlFor` o wrapper)
- Checkbox / radio sin área clicable unificada es error
- Navegación sin `<a>` / `<Link>` es error
- Acciones destructivas sin confirmación o undo es error

### Rendimiento
- Evitar "waterfalls" de peticiones
- Cachear en local todo lo posible
- Virtualizar listas grandes (> ~50 elementos)


### Anti-patterns (Always Flag)

- Números mágicos
- Espaciado inconsistente entre vistas similares
- Colores hardcodeados en componentes