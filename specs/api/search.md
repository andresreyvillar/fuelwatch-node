# API: Search

## Archivo: `src/pages/api/search.ts`

## Endpoint

```
GET /api/search
```

## Parametros

| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `target` | string | `""` | Localidad o codigo postal a buscar |
| `page` | number | `1` | Pagina actual (paginacion) |
| `limit` | number | `20` | Resultados por pagina |
| `ids` | string | - | IDs separados por coma (modo alternativo) |
| `province` | string | - | Provincia exacta (modo provincia; valor de `/api/suggestions`) |
| `fuel` | `diesel` \| `gas95` | - | Carburante de orden en modo provincia (obligatorio) |

## Modos de operacion

### Modo 1: Busqueda por localidad (`target`)

```
GET /api/search?target=Madrid&page=1&limit=50
```

1. Llama a `searchStations(query, page, limit)` de `fuel.ts`
2. Construye condiciones de busqueda con `getSearchConditions(query)`
3. Query a `servicestations` con `.or(conditions)`, paginado con `.range(skip, skip+limit-1)`
4. Ordena por `cp` ascendente
5. Adjunta tendencias de 3 dias via `attachTrends()`
6. Devuelve datos + metadata de paginacion

### Modo 2: Busqueda por IDs (`ids`)

```
GET /api/search?ids=1234,5678,9012
```

1. Parsea `ids` como array de numeros (split por coma, parseInt, filter NaN)
2. Llama a `getStationsByIds(ids)` de `fuel.ts`
3. Query a `servicestations` con `.in('id_ss', ids)`
4. Adjunta tendencias via `attachTrends()`
5. Devuelve datos sin metadata de paginacion

**Uso**: Se usa para cargar datos frescos de estaciones favoritas (pinned).

### Modo 3: Busqueda por provincia (`province` + `fuel`)

```
GET /api/search?province=PONTEVEDRA&fuel=diesel&page=1&limit=50
```

1. Si `fuel` no es `diesel` ni `gas95` (o falta), responde 400 `{ "error": "Invalid fuel" }`
2. Llama a `searchStationsByProvince(province, fuel, page, limit)` de `fuel.ts`
3. Query a `servicestations` con `.eq('provincia', province)` y `.gt(columna, 0)` (`diesel` -> `precio_diesel`, `gas95` -> `precio_gasolina_95`): las estaciones sin precio de ese carburante no aparecen ni cuentan
4. Ordena por esa columna ascendente y por `id_ss` ascendente (desempate estable para paginar)
5. Paginado con `.range()`, tendencias via `attachTrends()`, misma metadata que el modo target

Precedencia: `province` > `ids` > `target`.

## Respuesta exitosa (200)

### Modo target:
```json
{
  "data": [
    {
      "id_ss": 1234,
      "rotulo": "REPSOL",
      "horario": "L-D: 24H",
      "precio_diesel": 1.339,
      "precio_diesel_extra": 1.349,
      "precio_gasolina_95": 1.459,
      "precio_gasolina_98": 1.579,
      "direccion": "RONDA SEGOVIA, 37",
      "provincia": "MADRID",
      "localidad": "MADRID",
      "cp": "28005",
      "longitud": -3.123,
      "latitud": 40.456,
      "fecha_actualizacion": "2026-02-22T10:00:00.000Z",
      "trend": {
        "station_id": 1234,
        "fecha": "2026-02-19",
        "diesel": 1.329,
        "diesel_extra": 1.339,
        "gas95": 1.449,
        "gas98": 1.569
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "lastPage": 3
  }
}
```

### Modo ids:
```json
{
  "data": [ /* misma estructura de Station */ ]
}
```

## Respuesta de error (400, modo provincia)

```json
{ "error": "Invalid fuel" }
```

## Respuesta de error (500)

```json
{
  "error": "mensaje de error"
}
```

## Dependencias

- `searchStations()` de `lib/fuel.ts`
- `getStationsByIds()` de `lib/fuel.ts`
- `searchStationsByProvince()` de `lib/fuel.ts`
