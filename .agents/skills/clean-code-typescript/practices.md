# Buenas prácticas de TypeScript (repositorio corporativo de skills de Cloud District)


### Tipado Estricto
- **Prohibido `any`.**
- Usa `unknown` + *type narrowing* si el tipo no es conocido.
- **Siempre define el tipo de retorno** en funciones públicas.

```ts
// Bad
const parse = (data: any) => data.toUpperCase();

// o
const parse = (data: unknown): string => {
  if (typeof data === 'string') return data.toUpperCase();
  throw new Error('Invalid data');
};
```


### Modelado de Datos
* **Interfaces vs Types:**
    * `interface` para modelos de datos extensibles (Objetos).
    * `type` para Uniones, Intersecciones y Primitivos.
* **Uniones > Enums:** Prefiere `type Role = 'admin' | 'user'` sobre `enum Role {}`.

### Funciones
* **Nombres Descriptivos y Explícitos:**
    * Las variables deben explicar qué contienen sin necesidad de contexto extra.
    * **Funciones:** El nombre debe decir exactamente qué hace (Verbo + Sustantivo).
    ```typescript
    // Bad
    const d = new Date(); // What is d?
    const handleData = () => { ... } // What does it handle?

    // Good
    const transactionDate = new Date();
    const fetchUserTransactions = () => { ... }
    ```
* **Una Función, Una Acción (SRP):**
    * Las funciones deben hacer una sola cosa. Esto facilita el testing, el refactor y la lectura.
    * Si el nombre de la función necesita un "And" (ej: `validateAndSave`), divídela en dos.
* **Argumentos por Defecto:**
    * Usa la sintaxis de ES6 para valores por defecto en lugar de lógica interna.
    ```typescript
    // Bad
    function createItem(qty) {
      const quantity = qty || 1;
    }
    // Good
    function createItem(quantity: number = 1) { ... }
    ```

### Lógica y Control de Flujo
* **Evitar Condicionales Negativos:**
    * Las negaciones dobles o condiciones negativas aumentan la carga cognitiva. Extrae la condición a una variable positiva o invierte la lógica.
    ```typescript
    // Bad
    if (!isNotEnabled) { ... }
    if (!user.hasNoAccess) { ... }

    // Good
    const isEnabled = !isNotEnabled;
    if (isEnabled) { ... }
    if (user.hasAccess) { ... }
    ```
* **Operadores Modernos:**
    * Usa `??` (Nullish Coalescing) para nulos estrictos.
    
    * Usa `?.` (Optional Chaining) para acceso seguro.

### Paradigma Funcional vs Imperativo
* **Favor Functional Programming:**
    * Evita la programación imperativa (bucles `for`, `while`, mutación de estados).
    * Usa métodos declarativos de array: `.map()`, `.filter()`, `.reduce()`, `.find()`, `.some()`, `.every()`.
    
* **Inmutabilidad:**
    * Trata los datos como inmutables. Usa `const` por defecto.
    * Usa `readonly` en arrays o propiedades que no deben cambiar.
    ```typescript
    // Bad (Imperative & Mutable)
    const names = [];
    for (let i = 0; i < users.length; i++) {
      names.push(users[i].name);
    }

    // Good (Functional & Immutable)
    const names = users.map(user => user.name);
    ```

### Utility Types (DRY)
* No repitas tipos manualmente. Usa `Pick`, `Omit`, `Partial` y `ReturnType` para derivar tipos nuevos de los existentes.


## TypeScript Best Practices
- Se prefiere `interface` frente a `type` para definir formas de objetos (mejores mensajes de error).
- Se utilizan *const assertions* (`as const`) para tipos literales.
- Se aprovechan *type guards* y *type predicates* cuando aplica.
- Se evita complejidad innecesaria de tipos si existe una solución más simple.
- Los *template literal types* se usan solo cuando aportan valor real.
- Se emplean *branded types* para primitivas de dominio (IDs, valores semánticos).
- La complejidad de los tipos no provoca compilaciones lentas.
- No existe una profundidad excesiva de instanciación de tipos.
- Patrones de `import` / `export` consistentes en todo el proyecto.
- No existen dependencias circulares.
- Uso de *dynamic imports* para *code splitting* cuando aplica.
- Manejo de errores mediante *result types* o *discriminated unions*.
- Errores personalizados con herencia correcta.
- *Error boundaries* tipadas de forma segura.
- `switch` exhaustivos con soporte del tipo `never`.
- Tipos co-localizados con su implementación cuando tiene sentido.
- Tipos compartidos ubicados en módulos dedicados.
- Se evita la augmentación global de tipos siempre que sea posible.
- Uso correcto de archivos de declaración (`.d.ts`).