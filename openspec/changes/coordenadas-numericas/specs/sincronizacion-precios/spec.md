## ADDED Requirements

### Requirement: Coordenadas numéricas en la sincronización
Las dos rutas de sincronización (`scripts/sync-prices.mjs` y `GET /api/update-prices`) DEBEN guardar la
latitud y la longitud de cada estación como números, convirtiendo la coma decimal del Ministerio, y como
`null` cuando el valor llega vacío o no es un número.

#### Scenario: coordenadas-guardadas-como-numero
**WHEN** la sincronización recibe del Ministerio una estación con `"Latitud": "42,240611"` y `"Longitud (WGS84)": "-8,720278"`
**THEN** la estación se guarda con `latitud` 42.240611 y `longitud` -8.720278 como números

#### Scenario: coordenada-sin-dato-es-null
**WHEN** la latitud o la longitud de una estación llegan vacías o no son un número
**THEN** esa coordenada se guarda como `null` (nunca 0 ni NaN) y el resto de la estación se guarda igual

verified-by:
  - frontend_astro/tests/coordenadas-numericas/sync-script.test.ts::coordenadas-guardadas-como-numero
  - frontend_astro/tests/coordenadas-numericas/update-prices.test.ts::coordenadas-guardadas-como-numero
  - frontend_astro/tests/coordenadas-numericas/sync-script.test.ts::coordenada-sin-dato-es-null
  - frontend_astro/tests/coordenadas-numericas/update-prices.test.ts::coordenada-sin-dato-es-null
