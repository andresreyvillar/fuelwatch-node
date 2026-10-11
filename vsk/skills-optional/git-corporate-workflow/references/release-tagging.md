# Release Tagging

## Reglas

- Etiquetar cada release con SemVer.
- Usar prefijo `v` (ej: `v1.4.0`).
- Taggear solo despues de merge a `main/master`.

## Flujo sugerido

1. Preparar rama `release/<version>` desde `develop`.
2. Ajustes finales y PR a `main/master`.
3. Merge a `main/master` y vuelta a `develop`.
4. Crear tag:

```bash
git tag v<version>
git push --tags
```
