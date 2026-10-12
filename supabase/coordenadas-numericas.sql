-- Slice coordenadas-numericas: servicestations.latitud y longitud pasan de texto ("42,240611") a double precision.
--
-- Cuándo: DESPUÉS de desplegar el código del slice y de que una sincronización horaria haya terminado bien
-- (desde ese momento las dos rutas de sincronización envían números o null).
-- Dónde: editor SQL de Supabase (requiere permisos de propietario; la clave anon no puede hacer DDL).

-- La regla es la de parseCoordinate() (sync-prices.mjs y lib/fuel.ts): quitar espacios, tabuladores y saltos
-- de línea de los extremos, coma → punto y aceptar solo ^-?[0-9]+(\.[0-9]+)?$.

-- 1. Comprobación previa: tipo actual y cuántas filas se convertirán y cuántas quedarán en null.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'servicestations' AND column_name IN ('latitud', 'longitud');

SELECT
  count(*) AS estaciones,
  count(*) FILTER (WHERE regexp_replace(replace(latitud::text, ',', '.'), '^\s+|\s+$', '', 'g') ~ '^-?[0-9]+(\.[0-9]+)?$') AS latitudes_validas,
  count(*) FILTER (WHERE regexp_replace(replace(longitud::text, ',', '.'), '^\s+|\s+$', '', 'g') ~ '^-?[0-9]+(\.[0-9]+)?$') AS longitudes_validas
FROM public.servicestations;

-- 2. Copia de seguridad de las coordenadas originales (lo que no sea decimal pasará a NULL de forma irreversible).
--    Va en el esquema backup, que la API (PostgREST) no expone. Bórrala cuando hayas revisado el paso 4:
--    DROP TABLE backup.servicestations_coords_bak;
CREATE SCHEMA IF NOT EXISTS backup;
REVOKE ALL ON SCHEMA backup FROM anon, authenticated;
CREATE TABLE IF NOT EXISTS backup.servicestations_coords_bak AS
  SELECT id_ss, latitud::text AS latitud, longitud::text AS longitud FROM public.servicestations;

-- 3. Conversión: coma o punto decimal → double precision; vacío o no numérico → NULL.
--    Ejecútala lejos del minuto 0 (la sincronización es horaria). Si la tabla está bloqueada más de 5 s,
--    falla y no cambia nada: vuelve a intentarlo.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.servicestations
  ALTER COLUMN latitud TYPE double precision
    USING CASE
      WHEN regexp_replace(replace(latitud::text, ',', '.'), '^\s+|\s+$', '', 'g') ~ '^-?[0-9]+(\.[0-9]+)?$'
        THEN regexp_replace(replace(latitud::text, ',', '.'), '^\s+|\s+$', '', 'g')::double precision
    END,
  ALTER COLUMN longitud TYPE double precision
    USING CASE
      WHEN regexp_replace(replace(longitud::text, ',', '.'), '^\s+|\s+$', '', 'g') ~ '^-?[0-9]+(\.[0-9]+)?$'
        THEN regexp_replace(replace(longitud::text, ',', '.'), '^\s+|\s+$', '', 'g')::double precision
    END;

-- Índice para buscar estaciones dentro de una caja (rango de latitud y longitud), base de la ruta (slice 3b).
CREATE INDEX IF NOT EXISTS servicestations_latitud_longitud_idx
  ON public.servicestations (latitud, longitud);

COMMIT;

-- 4. Comprobación posterior: con_latitud / con_longitud deben coincidir con latitudes_validas / longitudes_validas
--    del paso 1. Los mínimos y máximos pueden salir de España por errores del propio Ministerio (el 2026-10-12:
--    3 estaciones con "0,000000" y la 16268 con latitud y longitud invertidas); la segunda consulta los lista.
SELECT
  count(*) AS estaciones,
  count(latitud) AS con_latitud,
  count(longitud) AS con_longitud,
  min(latitud) AS lat_min, max(latitud) AS lat_max,
  min(longitud) AS lon_min, max(longitud) AS lon_max
FROM public.servicestations;

SELECT id_ss, rotulo, localidad, latitud, longitud
FROM public.servicestations
WHERE latitud NOT BETWEEN 27 AND 44 OR longitud NOT BETWEEN -19 AND 5
ORDER BY id_ss;
