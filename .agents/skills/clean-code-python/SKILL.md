---
name: clean-code-python
description: Clean code y buenas prácticas de Python para VSK — nombres, funciones con type hints, dataclasses/pydantic, errores explícitos, comentarios del porqué, tests pytest que cazan zombis y olores como catálogo de refutaciones. Obligatoria en las fases tdd, implement y refactor de proyectos Python; también para revisar o refactorizar código Python.
---

# clean-code-python

Reglas que prevalecen sobre el criterio general. Al recomendar algo, cita la sección («§4: detectar nunca
muta»). Las reglas propias del proyecto están en `vsk/PROJECT.md` y ganan a estas.

| Fase de VSK | Cargar |
|---|---|
| tdd | §5 Tests |
| implement | §1-§4 |
| refactor | §1-§4 y §6 |
| verify | §6 como catálogo de refutaciones para la revisión adversarial |

## §1 · Nombres
- `snake_case` para módulos, funciones y variables; `PascalCase` para clases; `UPPER_SNAKE` para
  constantes. Ficheros `snake_case.py`.
- Un nombre que necesita comentario está mal elegido: `MIN_QUOTE_CHARS` se explica solo; `LIMIT` no.
- Los tests describen el comportamiento, no la función: `test_a_tie_shares_the_same_rank`, no
  `test_rank`. El nombre del test es documentación ejecutable.

## §2 · Funciones y tipos
- Una responsabilidad por función y **early returns**: guardas en lugar de `if` anidados.
- **Type hints en toda firma pública**; `mypy --strict` (o el nivel que fije el proyecto) es un gate.
- `dataclass(frozen=True)`, `NamedTuple` o `pydantic` antes que `dict[str, Any]` para estructuras con forma
  conocida. Un diccionario que viaja entre módulos es una firma que no impide el mal uso.
- **Cambia la forma de la API antes que documentar cómo no equivocarse:** si olvidar un parámetro produce
  un bug, hazlo obligatorio y solo por nombre (`*, before`); el tipado señalará a todos los llamantes.
- `pathlib` antes que `os.path`; `enum`/`Literal` para conjuntos cerrados; `match` exhaustivo cuando ayude.
- Sin estado global mutable; dependencias (reloj, aleatoriedad, red, ficheros) inyectadas.

## §3 · Comentarios
- Explican el porqué, nunca el qué. Un umbral lleva de dónde sale.
- No añadir docstrings ni anotaciones a código que no se ha modificado.
- El comentario que más vale cuenta el fallo que justifica la línea.

## §4 · Errores
- **Nunca fallar en silencio:** o se recupera por otra vía o queda registrado con su motivo.
- Aísla el fallo en el nivel correcto: que falle un ítem no es que falle el lote.
- Un fallo propio no se atribuye a un tercero; el caso por defecto de un clasificador no culpa a otro.
- **Detectar nunca muta:** construir un error, registrar o clasificar no escribe, mueve ni borra nada.
- `except Exception` solo cuando lo siguiente es una alternativa real, con el motivo escrito al lado.
  Nunca como red de seguridad genérica. Excepciones propias con `raise ... from err`.
- Nunca conviertas un nulo a texto: `str(d.get("k", ""))` devuelve `"None"` si la clave viene nula.

## §5 · Tests (pytest)
- El test se escribe antes y se ve en rojo: `@pytest.mark.xfail(strict=True, reason="rojo: <slug>")`
  lo impone; si pasa sin implementación, rompe la suite. Anota el escenario: `# @scenarios <slug>`.
- **Un test que puede pasar por vacío no vale:** comprueba que el dato existe además de que el resultado
  es el esperado.
- Nada de aserciones tautológicas ni de `mock` de la unidad bajo prueba. `pytest.approx` para flotantes.
- Fixtures pequeñas y locales; `tmp_path` para ficheros; `monkeypatch` para entorno; reloj congelado
  inyectado. Parametriza los casos (cero, uno, varios, límites, entradas inválidas).
- Cuando el fallo vino de datos reales, el dato real (anonimizado) va en el test.
- Para caer ante su zombi, el test afirma el comportamiento del escenario completo, no un detalle incidental.
- Puertas mecánicas sobre el propio código cuando el error es un patrón: un test que recorre los ficheros
  buscando la forma prohibida, y que demuestra que detecta de verdad.

## §6 · Olores (catálogo de refutaciones)
- Validación que no valida: comprueba qué valida con esta configuración, no que exista.
- Señal binaria donde hace falta gradación; umbral heredado de otra escala.
- Cero como afirmación: lo que no se mide se declara ausente.
- Caché sin clave de versión; identidad recalculada aguas abajo.
- Dos mecanismos para lo mismo: usa el patrón que el repo ya tiene.
- Configuración que parece configuración y no lo es.
- Estado compartido antes de subir la concurrencia.

## §7 · Lo que no se hace
- Refactorizar de paso código adyacente que funciona.
- Abstracciones de un solo uso, manejo de errores para casos imposibles, funcionalidad que nadie pidió.
- Cambios de esquema sin señalarlos; borrar evidencias de ejecución.

## Registro del gate
Tras revisar el diff con estas reglas y corregir lo encontrado:
`./vsk/bin/vsk run add --change <id> --fase refactor --actor agente --gate clean-code=pass`.

Origen: skill `python-clean-code` de JRB, generalizada.
