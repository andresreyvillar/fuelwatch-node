# estadistica-zona

## Purpose

Por definir.

## Requirements

### Requirement: Estadística por carburante
El sistema DEBE devolver, para la localidad pedida, el precio mínimo, máximo y medio de cada uno de los
cuatro carburantes (`diesel`, `diesel_extra`, `gas95`, `gas98`), calculados solo con precios mayores que 0.

#### Scenario: cuatro-carburantes-con-precio
**WHEN** se pide la estadística de una localidad cuyas estaciones tienen precios válidos de los cuatro carburantes
**THEN** responde 200 con `diesel`, `diesel_extra`, `gas95` y `gas98`, cada uno con el mínimo, el máximo y la media de los precios de ese carburante en esas estaciones

#### Scenario: precios-sin-dato-se-ignoran
**WHEN** alguna estación de la localidad tiene precio 0 en un carburante que otras estaciones sí venden
**THEN** el mínimo, el máximo y la media de ese carburante se calculan solo con los precios mayores que 0

verified-by:
  - frontend_astro/tests/estadistica-zona-4-carburantes/stats.test.ts::cuatro-carburantes-con-precio
  - frontend_astro/tests/estadistica-zona-4-carburantes/stats.test.ts::precios-sin-dato-se-ignoran

### Requirement: Carburante sin datos se omite
El sistema NO DEBE incluir en la estadística un carburante sin ningún precio válido en la localidad.

#### Scenario: carburante-sin-precios-se-omite
**WHEN** ninguna estación de la localidad tiene precio válido de un carburante, pero sí de otros
**THEN** la respuesta no incluye la clave de ese carburante e incluye las de los carburantes con precio

verified-by:
  - frontend_astro/tests/estadistica-zona-4-carburantes/stats.test.ts::carburante-sin-precios-se-omite

### Requirement: Sin estadística cuando no hay precios válidos
El sistema DEBE responder `null` cuando ninguna estación de la localidad tiene un precio válido.

#### Scenario: localidad-sin-precios-validos
**WHEN** la localidad tiene estaciones pero ninguna tiene precio válido de ningún carburante
**THEN** responde 200 con `null`

verified-by:
  - frontend_astro/tests/estadistica-zona-4-carburantes/stats.test.ts::localidad-sin-precios-validos

### Requirement: Estadística de zona de una provincia
El sistema DEBE calcular la estadística de zona de una provincia con todas las estaciones de esa provincia,
con las mismas reglas que la estadística por carburante (precios mayores que 0, carburantes sin datos
omitidos, `null` si no queda ninguno).

#### Scenario: estadistica-de-provincia
**WHEN** se pide la estadística de zona de una provincia
**THEN** se calcula con todas las estaciones de esa provincia (las mismas reglas de la estadística de zona) y no con las localidades cuyo nombre coincide

verified-by:
  - frontend_astro/tests/busqueda-por-provincia/stats.test.ts::estadistica-de-provincia
