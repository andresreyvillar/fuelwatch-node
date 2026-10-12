---
slice: coordenadas-numericas
status: shipped
kind: action
actor: sincronizador
trigger:
  type: cron
  surface: api
  detail: "sync-fuel-prices.yml cada hora (scripts/sync-prices.mjs) y GET /api/update-prices"
events:
  emits: []
  consumes: []
specs:
  - sincronizacion-precios
tests_root: frontend_astro/tests/coordenadas-numericas
blocked: null
---

# La sincronización guarda las coordenadas de cada estación como números

**Actor:** sincronizador
**Trigger:** la sincronización horaria de GitHub Actions (`scripts/sync-prices.mjs`) y `GET /api/update-prices`
(`updateDataFromMinistry()` en `frontend_astro/src/lib/fuel.ts`).

## Contexto

Primera mitad del slice 3 (ruta con gasolineras): para buscar estaciones cerca de una ruta hay que filtrar
por coordenadas en la base de datos, y hoy no se puede.

Datos medidos (Supabase, 2026-10-11): `latitud` y `longitud` llegan como texto con coma decimal
(`"38,984139"`, `"-1,847083"`), copiados tal cual del Ministerio. La spec (`specs/02-data-model.md`) dice
NUMERIC, pero el volcado original (`carburantes.sql`) las crea como `varchar(25)`. Con texto no hay
comparación por rango (una caja alrededor de la ruta). Ningún código de la app lee hoy estas columnas.

Las dos rutas de sincronización copian las coordenadas sin parsear; cualquier cambio de parseo debe ir en las
dos (CLAUDE.md).

Plan de despliegue en dos pasos, porque la migración la ejecuta el humano en el editor SQL de Supabase:
1. Este slice: las dos sincronizaciones envían números. Con la columna aún de texto, Postgres los guarda
   como `"38.984139"`: no rompe nada.
2. El humano ejecuta `supabase/coordenadas-numericas.sql` (columna → `double precision`, convirtiendo la
   coma, e índice para búsquedas por caja). Desde ahí, las sincronizaciones escriben en columnas numéricas.

Job story: `sincronizar-precios`.

## Comportamiento observable

### coordenadas-guardadas-como-numero
**WHEN** la sincronización recibe del Ministerio una estación con `"Latitud": "42,240611"` y `"Longitud (WGS84)": "-8,720278"`
**THEN** la estación se guarda con `latitud` 42.240611 y `longitud` -8.720278 como números

### coordenada-sin-dato-es-null
**WHEN** la latitud o la longitud de una estación llegan vacías o no son un número
**THEN** esa coordenada se guarda como `null` (nunca 0 ni NaN) y el resto de la estación se guarda igual

## Estado después

`servicestations.latitud` y `longitud` contienen números (tras la migración, en columnas `double precision`
con índice). `/api/search` devuelve las coordenadas como números, como ya decía `specs/api/search.md`.

## Edge cases

- Comportamiento que se conserva (regresión, sin `@scenarios`): los precios se siguen parseando igual y las
  estaciones con algún precio > 0 siguen generando su fila de `price_history`.
- Las dos rutas cumplen los mismos escenarios: el script de Actions y `GET /api/update-prices`.
- La migración se verifica con una consulta de conteo antes y después (en `tasks.md`); no tiene test
  automático porque nadie más que el humano tiene permisos de DDL.

## Fuera de alcance

- La ruta, el mapa y la búsqueda por corredor: slice 3b (`large`, con `design.md`).
- Unificar el host del Ministerio: `updateDataFromMinistry()` usa aún `sedeaplicaciones.minetur.gob.es` y el
  script `energia.serviciosmin.gob.es`. Es una divergencia previa; slice aparte.
- Unificar las dos rutas de sincronización en un módulo común: refactor mayor, no lo pide este slice.
- Revisar las políticas RLS de escritura: pendiente del slice de seguridad.
