# Git Team Workflow

## Idea principal

Mantra del trabajo colaborativo: "Always be branching, and always be pulling".

- Crear ramas siempre.
- Actualizarse desde `main` antes de integrar cambios.
- Tras enviar un PR, no reutilizar esa rama: considerarla "muerta" y crear otra nueva.

## Flujo de trabajo recomendado

### Empezar a programar en un proyecto

```bash
cd REPONAME

git checkout main
git pull
git checkout -b BRANCHNAME
code .
```

Despues de editar:

```bash
git add .
git commit -m "[FILENAME] UPDATE"
git push -u origin BRANCHNAME
```

En siguientes envios:

```bash
git push
```

### Continuar despues de una pausa

```bash
git checkout BRANCHNAME
git pull origin main
```

Resolver conflictos si aparecen y continuar desde `git add .`.

### Continuar tras enviar un Pull Request

```bash
git checkout -b NEWBRANCHNAME
git merge OLDBRANCHNAME
git pull origin main
```

Resolver conflictos y seguir trabajando.

## Testing

### Frontend

```bash
npm start
```

- Navegar por la zona afectada.
- Inspeccionar elementos si hace falta.
- Tomar capturas para facilitar pruebas a otros.

### Backend

```bash
npm start
```

- Usar Postman.
- Probar rutas.
- Documentar con capturas.

### Probar codigo de otra persona

```bash
git checkout main
git pull
git checkout SOMEONEELSESBRANCH
```

- Probar todo lo indicado en el PR.

## Pull Requests

### Enviar un Pull Request

```bash
git pull origin main
```

Resolver conflictos, luego:

```bash
git add .
git commit
git push
```

En GitHub:

- Crear nuevo PR.
- Anadir checklist de pruebas.
- Asignar revisor.
- Crear PR.
- Documentar conflictos si existen.

### Aprobar Pull Requests

- Probar lo indicado.
- Hacer merge.
- Eliminar la rama tras el merge.

## Gestion de conflictos

### Resolver tus propios conflictos

```bash
git checkout CONFLICTEDBRANCH
git pull origin main
code .
```

Buscar:

```
>>>>>
<<<<<
=====
```

Luego:

```bash
git add .
git commit -m "[FILENAME] Resolve conflicts with ISSUE"
git push origin CONFLICTEDBRANCH
```

### Resolver conflictos de otros

- Abrir PR en GitHub.
- Leer comentarios.
- Resolver conflictos en interfaz.
- Marcar como resuelto.
- Confirmar merge.

## Trabajar con versiones antiguas

### Ver historial

```bash
git checkout main
git pull
git log
```

### Ir a un commit especifico

```bash
git checkout COMMIT_HASH
```

### Crear rama desde ese commit

```bash
git switch -c NEWBRANCHNAME
```

### Recuperar una rama eliminada

Desde GitHub -> Pull Requests -> Closed -> Restore branch.

## Buenas practicas

### Mensajes de commit

Formato recomendado:

```bash
git commit -m "[FILE] IMPERATIVE MESSAGE"
```

Ejemplos:

```bash
git commit -m "[App] Change function to class"
git commit -m "[Signup] Fix error messages"
```

Para bugs:

- Un commit antes del arreglo.
- Varios durante la investigacion.
- Uno final con la solucion.

### Pull Requests efectivos

- Checklist con rutas de archivos:

```
- [ ] src/components/pages/Signup.js
```

- Capturas de resultados.
- Notas de reproduccion de pruebas.

## Mantenimiento continuo

```bash
git pull origin main
```

Resolver conflictos con frecuencia.

- Varias PR al dia es normal.
- Coordinar revisiones.
- Activar notificaciones de GitHub.

## Rama de respaldo

Antes de cambios grandes:

```bash
git checkout -b BACKUPBRANCH
git push
```

## Nunca usar

```bash
git reset --hard COMMIT
git push --force
```

(Eliminan historial y pueden borrar trabajo de otros)

## Comandos Git (Referencia)

### Clonar

```bash
git clone URL
git clone URL LOCALNAME
```

### Cambiar de rama

```bash
git checkout BRANCH
git checkout -b NEWBRANCH
git switch BRANCH
git switch -c NEWBRANCH
```

### Anadir

```bash
git add FILE
git add .
```

### Commit

```bash
git commit -m "[FILE] MESSAGE"
git commit -a
```

### Enviar cambios

```bash
git push
git push origin main
git push origin BRANCH
git push -u origin BRANCH
git push --all origin
```

### Traer cambios

```bash
git pull
git pull origin main
```

### Mezclar ramas

```bash
git merge OTHERBRANCH
git merge --abort
```

### Estado

```bash
git status
git status -b
```

### Ramas

```bash
git branch
git branch -d BRANCH
```

### Historial

```bash
git log
git log --follow FILE
git log --oneline
```

### Stash

```bash
git stash save
git stash pop
git stash list
git stash drop
git stash --include-untracked
```

### Borrar archivos

```bash
git rm FILE
git clean -f
```

### Reset

```bash
git reset
```
