# API: History

## Archivo: `src/pages/api/history.ts`

## Endpoint

```
GET /api/history
```

## Parametros

| Param | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `id` | number | Si | ID de la estacion (id_ss) |

## Logica

1. Valida que `id` este presente, sino devuelve 400
2. Llama a `getStationHistory(parseInt(id))` de `fuel.ts`
3. Query a `price_history`:
   - Filtra por `station_id = id`
   - Filtra `fecha >= hoy − 29 dias` (fecha UTC): ultimos 30 dias naturales, incluido hoy
   - Ordena por `fecha` ascendente
   - Sin limite de registros; los dias sin datos no se rellenan con dias anteriores
   - Si no hay dias en la ventana, devuelve `[]`
   - Campos: `fecha, diesel, gas95, diesel_extra, gas98`

## Respuesta exitosa (200)

```json
[
  {
    "fecha": "2026-01-23",
    "diesel": 1.299,
    "gas95": 1.419,
    "diesel_extra": 1.309,
    "gas98": 1.539
  },
  {
    "fecha": "2026-01-24",
    "diesel": 1.305,
    "gas95": 1.425,
    "diesel_extra": null,
    "gas98": null
  }
]
```

**Nota**: Los campos de precio pueden ser `null` si la estacion no ofrece ese tipo de combustible.

## Respuesta de error

### 400 - Missing id
```json
{ "error": "Missing id" }
```

### 500 - Error interno
```json
{ "error": "mensaje de error" }
```

## Dependencias

- `getStationHistory()` de `lib/fuel.ts`
