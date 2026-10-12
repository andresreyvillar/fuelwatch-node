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
| `province` | string | - | Provincia exacta; si viene, se usa en lugar de `location` |

## Logica

Con `province`: llama a `getProvinceStats(province)`, que consulta `servicestations` con `.eq('provincia', province)` y aplica las mismas reglas (pasos 4-7). Sin `province`:

1. Llama a `getStats(location)` de `fuel.ts`
2. Construye condiciones de busqueda con `getSearchConditions(location)`
3. Query a `servicestations`:
   - Campos: `precio_diesel, precio_gasolina_95, precio_diesel_extra, precio_gasolina_98`
   - Filtro: `.or(conditions)`
4. Si no hay estaciones, devuelve `null`
5. Para cada carburante de `STATS_FUEL_COLUMNS` (`diesel` ← `precio_diesel`, `diesel_extra` ← `precio_diesel_extra`, `gas95` ← `precio_gasolina_95`, `gas98` ← `precio_gasolina_98`), `summarizePrices()` filtra precios > 0 y calcula min, max y avg (media aritmética, sin redondeo)
6. Un carburante sin ningún precio > 0 se omite de la respuesta
7. Si ningún carburante tiene precios > 0, devuelve `null`

## Respuesta exitosa (200)

```json
{
  "diesel": {
    "min": 1.199,
    "max": 1.459,
    "avg": 1.329
  },
  "diesel_extra": {
    "min": 1.289,
    "max": 1.559,
    "avg": 1.419
  },
  "gas95": {
    "min": 1.299,
    "max": 1.579,
    "avg": 1.439
  },
  "gas98": {
    "min": 1.449,
    "max": 1.729,
    "avg": 1.589
  }
}
```

**Nota**: las claves de carburantes sin ningún precio > 0 en la localidad no aparecen.

## Respuesta cuando no hay estaciones o ningún precio > 0 (200)

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
- `getProvinceStats()` de `lib/fuel.ts`
