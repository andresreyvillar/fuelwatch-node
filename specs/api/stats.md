# API: Stats

## Archivo: `src/pages/api/stats.ts`

## Endpoint

```
GET /api/stats
```

## Parametros

| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `location` | string | `""` | Localidad para calcular estadisticas |

## Logica

1. Llama a `getStats(location)` de `fuel.ts`
2. Construye condiciones de busqueda con `getSearchConditions(location)`
3. Query a `servicestations`:
   - Campos: `precio_diesel, precio_gasolina_95, precio_diesel_extra, precio_gasolina_98`
   - Filtro: `.or(conditions)`
4. Filtra precios > 0 para cada tipo
5. Calcula min, max, avg para diesel y gas95
6. Si no hay datos, devuelve `null`

### Calculo de avg

```typescript
const getAvg = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
```

## Respuesta exitosa (200)

```json
{
  "diesel": {
    "min": 1.199,
    "max": 1.459,
    "avg": 1.329
  },
  "gas95": {
    "min": 1.299,
    "max": 1.579,
    "avg": 1.439
  }
}
```

**Nota**: Solo calcula stats para `diesel` y `gas95`. No incluye `diesel_extra` ni `gas98` en las estadisticas (aunque los consulta).

## Respuesta cuando no hay datos (200)

```json
null
```

## Respuesta de error (500)

```json
{ "error": "mensaje de error" }
```

## Uso en frontend

Las stats se usan para calcular el porcentaje de la barra de precio en `StationCard`:

```
percentage = (price - min) / (max - min) * 100
clamped entre 5% y 95%
```

## Dependencias

- `getStats()` de `lib/fuel.ts`
