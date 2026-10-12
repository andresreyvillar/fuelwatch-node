## ADDED Requirements

### Requirement: Estadística de zona de una provincia
El sistema DEBE calcular la estadística de zona de una provincia con todas las estaciones de esa provincia,
con las mismas reglas que la estadística por carburante (precios mayores que 0, carburantes sin datos
omitidos, `null` si no queda ninguno).

#### Scenario: estadistica-de-provincia
**WHEN** se pide la estadística de zona de una provincia
**THEN** se calcula con todas las estaciones de esa provincia (las mismas reglas de la estadística de zona) y no con las localidades cuyo nombre coincide

verified-by:
  - frontend_astro/tests/busqueda-por-provincia/stats.test.ts::estadistica-de-provincia
