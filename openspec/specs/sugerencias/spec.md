# sugerencias

## Purpose

Por definir.

## Requirements

### Requirement: Sugerencias de localidades y provincias
El sistema DEBE devolver como sugerencias, para un texto de al menos 2 caracteres, las localidades y las
provincias que coinciden, cada una con su tipo (`localidad` o `provincia`) y su nombre exacto en la base de
datos. La coincidencia con provincias no distingue tildes ni la posición del artículo.

#### Scenario: sugerencias-incluyen-provincia
**WHEN** el conductor escribe al menos 2 caracteres que forman parte del nombre de una provincia
**THEN** las sugerencias incluyen esa provincia (`tipo: "provincia"`) además de las localidades que coinciden (`tipo: "localidad"`)

#### Scenario: sugerencia-provincia-sin-tildes-ni-articulo
**WHEN** el conductor escribe el nombre de una provincia sin tildes o con el artículo delante («malaga», «a coruna», «las palmas»)
**THEN** las sugerencias incluyen la provincia con su nombre exacto en la base de datos («MÁLAGA», «CORUÑA (A)», «PALMAS (LAS)»)

verified-by:
  - frontend_astro/tests/busqueda-por-provincia/suggestions.test.ts::sugerencias-incluyen-provincia
  - frontend_astro/tests/busqueda-por-provincia/suggestions.test.ts::sugerencia-provincia-sin-tildes-ni-articulo
