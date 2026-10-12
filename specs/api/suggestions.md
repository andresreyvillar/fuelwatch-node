# API: Suggestions

## Archivo: `src/pages/api/suggestions.ts`

## Endpoint

```
GET /api/suggestions
```

## Parametros

| Param | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `q` | string | Si (min 2 chars) | Query de busqueda |

## Logica

El endpoint delega en `getSuggestions(q)` de `lib/fuel.ts`, que devuelve primero las provincias que coinciden y despues las localidades.

### Provincias

`matchProvinces(q)` de `lib/provinces.ts` filtra la lista fija `PROVINCES` (las 52 provincias con la grafia de la columna `provincia`: `CORUÑA (A)`, `MÁLAGA`, `VALENCIA / VALÈNCIA`...). Compara sin tildes (`normalize('NFD')` + quitar marcas) y sin mayusculas, contra el nombre y contra la variante con el articulo delante (`CORUÑA (A)` -> `A CORUÑA`). No consulta la base de datos.

### Localidades (`findLocalities(q)`)

1. Si `q.trim().length < 2`, devuelve array vacio `[]`
2. Construye condiciones OR con el valor entre comillas (`quoteFilterValue()`):
   - Siempre: `localidad.ilike."%{q}%"`
   - Si el query empieza con un articulo espanol, agrega variante con formato DB
3. Query a `servicestations`:
   - Campo: `localidad` solamente
   - Filtro: `.or(conditions)`
   - Limite: 100 resultados
4. Extrae localidades unicas con `Set`
5. Ordena alfabeticamente
6. Devuelve las primeras 10

### Articulos espanoles

```typescript
const articles = ['A ', 'O ', 'LA ', 'EL ', 'LOS ', 'LAS ', 'AS ', 'OS '];
```

Si el query empieza con un articulo (ej: "LA CORUNA"), genera una condicion adicional buscando el formato almacenado en la DB: `localidad.ilike.%CORUNA%LA%` (las localidades se almacenan como "CORUNA (LA)" en la base de datos).

### Valores entre comillas

En `.or()` las comas, los puntos y los parentesis son delimitadores de PostgREST. El texto del usuario va siempre entre comillas dobles, escapando solo `"` y `\`; asi "CORUÑA (A)" funciona y el texto no puede añadir condiciones al filtro:
```typescript
const quoteFilterValue = (value: string) => `"${value.replace(/["\\]/g, '\\$&')}"`;
```
(El escape con barra invertida `\(` hacia fallar la consulta: "LIKE pattern must not end with escape character".)

## Respuesta exitosa (200)

```json
[
  { "tipo": "provincia", "nombre": "MADRID" },
  { "tipo": "localidad", "nombre": "MADRID" },
  { "tipo": "localidad", "nombre": "MADRIDEJOS" },
  { "tipo": "localidad", "nombre": "MADRIGUERAS" }
]
```

## Query corto (200)

Si `q.trim().length < 2`:
```json
[]
```

## Respuesta de error (500)

```json
{ "error": "mensaje de error" }
```

## Dependencias

- `getSuggestions()` de `lib/fuel.ts`
- `matchProvinces()` de `lib/provinces.ts` (via fuel.ts)
