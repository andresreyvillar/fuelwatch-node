# Flow: Data Sync (Sincronizacion de datos)

## Flujo de sincronizacion de precios desde el Ministerio

### Diagrama

```
GitHub Actions (cron cada hora)
  │
  ├─ curl https://fuel-watch.pages.dev/api/update-prices
  │
  ▼
Cloudflare Pages (edge)
  │
  ├─ GET /api/update-prices
  │   └─ updateDataFromMinistry()
  │
  ▼
Ministry API (gobierno de Espana)
  │
  ├─ GET https://sedeaplicaciones.minetur.gob.es/
  │      ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/
  │
  ├─ Response: JSON con ListaEESSPrecio (12000+ estaciones)
  │
  ▼
Procesamiento (en edge worker)
  │
  ├─ Para cada estacion en ListaEESSPrecio:
  │   ├─ parseInt(IDEESS) -> id_ss
  │   ├─ parsePrice("1,339") -> 1.339
  │   ├─ Crear registro servicestations
  │   └─ Si tiene precios > 0: crear registro price_history
  │
  ├─ stations[]: ~12000 registros
  └─ historyRows[]: ~12000 registros
  │
  ▼
Supabase (upsert en batches)
  │
  ├─ servicestations: upsert batches de 1000
  │   ON CONFLICT (id_ss) DO UPDATE
  │   -> Actualiza precios, horarios, direcciones...
  │
  └─ price_history: upsert batches de 1000
      ON CONFLICT (station_id, fecha) DO UPDATE
      -> Actualiza precios del dia (ultimo precio gana)
  │
  ▼
Response: { success: true, count: 12456 }
```

### Pasos detallados

#### 1. Trigger

- **Automatico**: GitHub Actions cron `0 * * * *` (cada hora en punto)
- **Manual**: Llamar directamente a `/api/update-prices` via navegador o curl
- **Sin autenticacion**: El endpoint es publico (idempotente)

#### 2. Fetch del Ministerio

```
URL: https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/
Metodo: GET
Respuesta: JSON (~5MB)
```

Estructura de la respuesta:
```json
{
  "Fecha": "22/02/2026 10:00:00",
  "ListaEESSPrecio": [
    {
      "IDEESS": "1234",
      "Rotulo": "REPSOL",
      "Precio Gasoleo A": "1,339",
      ...
    }
  ]
}
```

#### 3. Parsing de precios

Los precios del Ministerio usan formato espanol (coma decimal):
```
"1,339" -> parseFloat("1.339") -> 1.339
""       -> 0
null     -> 0
```

#### 4. Registro de servicestations

Campos mapeados (ver `02-data-model.md` para mapeo completo):
- `fecha_actualizacion`: `new Date().toISOString()` (timestamp del sync, no del Ministerio)

#### 5. Registro de price_history

- Solo se crea si al menos 1 precio > 0
- Precios = 0 se guardan como `null` (la estacion no ofrece ese tipo)
- `fecha`: `new Date().toISOString().split('T')[0]` (YYYY-MM-DD, fecha local del servidor)

#### 6. Upsert en batches

- Tamano de batch: 1000 registros
- Primero servicestations, luego price_history
- Secuencial (batch por batch), no paralelo

### Frecuencia y volumen

| Metrica | Valor |
|---------|-------|
| Frecuencia | Cada hora |
| Estaciones procesadas | ~12,000 |
| Registros price_history/dia | ~12,000 (upsert, solo ultimo gana) |
| Tamano respuesta Ministerio | ~5MB JSON |
| Batches por tabla | ~12 (12000 / 1000) |

### Comportamiento del upsert

- **servicestations**: Siempre actualiza todos los campos (precios, horario, etc.)
- **price_history**: ON CONFLICT (station_id, fecha) -> el ultimo precio del dia gana
  - Si la estacion actualiza precio 3 veces en un dia, solo se guarda el ultimo

### Manejo de errores

- Si el Ministerio no responde: error 500 con mensaje y stack trace
- Si Supabase falla en un batch: error se propaga (no hay retry)
- Los batches son secuenciales, si uno falla los siguientes no se ejecutan

### Logs

```
[update-prices] Starting fuel price synchronization
[update-prices] Sync completed: { success: true, count: 12456 }
```

O en caso de error:
```
[update-prices] Error during sync: <error message>
```
