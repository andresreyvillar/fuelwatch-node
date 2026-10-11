# Branching Model (Git Flow Corporativo)

## Ramas permanentes

- `develop`: integracion continua de features.
- `stage`: preproduccion y pruebas de release.
- `main` o `master`: produccion y releases etiquetados.

Estas ramas estan protegidas: no se permite commit directo. Solo via PR.

## Ramas de trabajo

- `feature/<jira-id>-<resumen-kebab>`: nuevas funcionalidades o mejoras.
- `bugfix/<jira-id>-<resumen-kebab>`: correcciones no criticas.
- `release/<version>`: preparacion de release.
- `hotfix/<jira-id>-<resumen-kebab>`: correccion urgente en produccion.

## Flujo basico

1. Crear rama desde la base correcta (feature/bugfix/release desde `develop`, hotfix desde `main`).
2. Trabajar con commits pequenos y frecuentes.
3. Abrir PR hacia la rama destino (feature/bugfix a `develop`, release a `main`, hotfix a `main`).
4. Merge de release/hotfix de vuelta a `develop` para mantener sincronizacion.

## Rebase y merge

- Usar `rebase` solo en ramas locales privadas.
- Evitar `rebase` en ramas compartidas; preferir merge.
