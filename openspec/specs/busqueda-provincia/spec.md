# busqueda-provincia

## Purpose

Por definir.

## Requirements

### Requirement: Búsqueda de estaciones por provincia ordenada por precio
El sistema DEBE devolver, para una provincia y un carburante (`diesel` = Gasóleo A, `gas95` = Gasolina 95),
las estaciones de esa provincia con precio mayor que 0 de ese carburante, ordenadas por ese precio de menor
a mayor (y por id a igual precio), paginadas, con el total de estaciones que cumplen el filtro.

#### Scenario: provincia-ordenada-por-precio
**WHEN** se buscan las estaciones de una provincia por Gasóleo A
**THEN** responde solo estaciones de esa provincia, ordenadas por precio de Gasóleo A de menor a mayor (a igual precio, por id), paginadas, con el total de la provincia

#### Scenario: provincia-ordenada-por-gasolina-95
**WHEN** se buscan las estaciones de una provincia por Gasolina 95
**THEN** el orden es por precio de Gasolina 95 de menor a mayor

#### Scenario: provincia-excluye-sin-carburante
**WHEN** alguna estación de la provincia no tiene precio del carburante elegido (precio 0)
**THEN** no aparece en la respuesta ni cuenta en el total

verified-by:
  - frontend_astro/tests/busqueda-por-provincia/search.test.ts::provincia-ordenada-por-precio
  - frontend_astro/tests/busqueda-por-provincia/search.test.ts::provincia-ordenada-por-gasolina-95
  - frontend_astro/tests/busqueda-por-provincia/search.test.ts::provincia-excluye-sin-carburante

### Requirement: Carburante obligatorio en la búsqueda por provincia
El sistema DEBE rechazar con 400 una búsqueda por provincia sin carburante o con un carburante distinto de
`diesel` y `gas95`.

#### Scenario: provincia-carburante-no-valido
**WHEN** se pide una búsqueda por provincia sin carburante o con uno distinto de `diesel` y `gas95`
**THEN** responde 400 con `{ "error": "Invalid fuel" }`

verified-by:
  - frontend_astro/tests/busqueda-por-provincia/search.test.ts::provincia-carburante-no-valido

### Requirement: Carburante de orden según los filtros activos
La app DEBE pedir la búsqueda por provincia ordenada por Gasóleo A si el filtro Diésel está activo y por
Gasolina 95 si solo lo está el filtro Gasolina.

#### Scenario: orden-provincia-segun-filtros
**WHEN** el conductor busca por provincia con el filtro Diésel, con el filtro Gasolina o con los dos
**THEN** la app pide el orden por Gasóleo A, por Gasolina 95 y por Gasóleo A, respectivamente

verified-by:
  - frontend_astro/tests/busqueda-por-provincia/sort-fuel.test.ts::orden-provincia-segun-filtros
