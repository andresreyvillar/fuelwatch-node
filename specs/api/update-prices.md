# API: Update Prices

## Archivo: `src/pages/api/update-prices.ts`

## Endpoint

```
GET /api/update-prices
```

## Parametros

Ninguno.

## Logica

1. Llama a `updateDataFromMinistry()` de `fuel.ts`
2. Loguea inicio y resultado con `console.log('[update-prices] ...')`
3. La funcion:
   - Fetch a la API del Ministerio: `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/`
   - Parsea JSON, extrae `ListaEESSPrecio`
   - Para cada estacion:
     - Parsea precios (formato espanol con coma -> float)
     - Crea registro para `servicestations`
     - Si tiene al menos 1 precio > 0, crea registro para `price_history`
   - Upsert en batches de 1000 a `servicestations` (ON CONFLICT id_ss)
   - Upsert en batches de 1000 a `price_history` (ON CONFLICT station_id, fecha)

### Datos del Ministerio

La API devuelve un JSON con estructura:
```json
{
  "Fecha": "22/02/2026 10:00:00",
  "ListaEESSPrecio": [
    {
      "IDEESS": "1234",
      "Rotulo": "REPSOL",
      "Horario": "L-D: 24H",
      "Precio Gasoleo A": "1,339",
      "Precio Gasoleo Premium": "1,349",
      "Precio Gasolina 95 E5": "1,459",
      "Precio Gasolina 98 E5": "1,579",
      "Direccion": "RONDA SEGOVIA, 37",
      "Provincia": "MADRID",
      "Localidad": "MADRID",
      "C.P.": "28005",
      "Longitud (WGS84)": "-3,123456",
      "Latitud": "40,456789"
    }
  ]
}
```

### parsePrice

```typescript
const parsePrice = (value: string): number => {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.'));
};
```

### Registro de price_history

Solo se crea si al menos un precio es > 0. Los precios = 0 se guardan como `null`:
```typescript
{
  station_id: id,
  fecha: today,                          // YYYY-MM-DD
  diesel: diesel > 0 ? diesel : null,
  diesel_extra: dieselExtra > 0 ? dieselExtra : null,
  gas95: gas95 > 0 ? gas95 : null,
  gas98: gas98 > 0 ? gas98 : null
}
```

## Respuesta exitosa (200)

```json
{
  "success": true,
  "count": 12456
}
```

`count` = numero total de estaciones procesadas.

## Respuesta de error (500)

```json
{
  "error": "mensaje de error",
  "stack": "stack trace..."
}
```

## Trigger

- **GitHub Actions**: Cron cada hora (`0 * * * *`)
- **Manual**: Tambien se puede llamar directamente via navegador o curl

## Seguridad

No tiene autenticacion. Cualquiera puede llamar al endpoint. La operacion es idempotente (upsert), asi que llamadas multiples no causan problemas.

## Dependencias

- `updateDataFromMinistry()` de `lib/fuel.ts`
