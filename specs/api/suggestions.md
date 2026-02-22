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

1. Si `q.length < 2`, devuelve array vacio `[]`
2. Escapa parentesis en el query: `(` -> `\(`, `)` -> `\)`
3. Construye condiciones OR:
   - Siempre: `localidad.ilike.%{safeQuery}%`
   - Si el query empieza con un articulo espanol, agrega variante con formato DB
4. Query a `servicestations`:
   - Campo: `localidad` solamente
   - Filtro: `.or(conditions)`
   - Limite: 100 resultados
5. Extrae localidades unicas con `Set`
6. Ordena alfabeticamente
7. Devuelve las primeras 10

### Articulos espanoles

```typescript
const articles = ['A ', 'O ', 'LA ', 'EL ', 'LOS ', 'LAS ', 'AS ', 'OS '];
```

Si el query empieza con un articulo (ej: "LA CORUNA"), genera una condicion adicional buscando el formato almacenado en la DB: `localidad.ilike.%CORUNA%LA%` (las localidades se almacenan como "CORUNA (LA)" en la base de datos).

### Escape de parentesis

Los parentesis en el query deben escaparse porque Supabase `.or()` los usa como delimitadores:
```typescript
const safeQuery = query.replace(/\(/g, '\\(').replace(/\)/g, '\\)');
```

## Respuesta exitosa (200)

```json
["MADRID", "MADRIGUERAS", "MADRIDEJOS"]
```

## Query corto (200)

Si `q.length < 2`:
```json
[]
```

## Respuesta de error (500)

```json
{ "error": "mensaje de error" }
```

## Dependencias

- `supabase` directamente de `lib/supabase.ts` (no usa fuel.ts)
