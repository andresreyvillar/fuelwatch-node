# Service: Search Conditions

## Funcion: `getSearchConditions(query)` en `src/lib/fuel.ts`

## Proposito

Construye un string de condiciones OR para Supabase `.or()` a partir de un query de busqueda. Maneja el formato especial de localidades espanolas donde el articulo va al final entre parentesis (ej: "CORUNA (LA)" en vez de "LA CORUNA").

## Signature

```typescript
function getSearchConditions(query: string): string
```

## Articulos Espanoles

```typescript
const articles = ['A ', 'O ', 'LA ', 'EL ', 'LOS ', 'LAS ', 'AS ', 'OS '];
```

## Algoritmo

1. **Condiciones base** (siempre):
   - `localidad.ilike.%{query}%` - busqueda directa
   - `cp.ilike.%{query}%` - busqueda por codigo postal

2. **Extraer nombre sin articulo** (`coreName`):
   - Quitar texto entre parentesis: `query.replace(/\(.*\)/g, '')`
   - Si el query empieza con un articulo, quitarlo
   - Si `coreName !== query`, agregar: `localidad.ilike.%{coreName}%`

3. **Variantes con articulos**:
   - Para cada articulo que coincida al inicio del query:
   - Extraer la parte principal (sin articulo)
   - Agregar: `localidad.ilike.%{mainPart} ({articulo})%`
   - Ejemplo: "LA CORUNA" -> `localidad.ilike.%CORUNA (LA)%`

4. **Variante con parentesis**:
   - Si el query tiene formato `"nombre (algo)"` (regex: `(.+) \((.+\))$`)
   - Agregar busqueda solo por el nombre: `localidad.ilike.%{name}%`

5. **Escapar parentesis**:
   - Todos los `(` y `)` en las condiciones se escapan como `\(` y `\)`
   - Necesario porque Supabase `.or()` usa parentesis como delimitadores

6. **Join**: Las condiciones se unen con `,` (OR en Supabase)

## Ejemplo

Input: `"La Coruña"`

Condiciones generadas:
```
localidad.ilike.%La Coruña%,
cp.ilike.%La Coruña%,
localidad.ilike.%Coruña%,
localidad.ilike.%Coruña \(LA\)%
```

## Uso

Llamada desde:
- `searchStations()` - para buscar estaciones
- `getStats()` - para calcular estadisticas de la zona
- (No se usa en `suggestions.ts` que tiene su propia logica simplificada)
