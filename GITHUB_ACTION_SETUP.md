# GitHub Actions - Configuración del Cron Job

Este documento explica cómo configurar GitHub Actions para ejecutar automáticamente la sincronización de precios de combustible cada hora.

## ¿Qué hace?

El workflow `.github/workflows/sync-fuel-prices.yml`:

- ✅ Se ejecuta automáticamente cada hora
- ✅ Llama al endpoint `/api/update-prices`
- ✅ Valida que el token sea correcto
- ✅ Verifica que la sincronización sea exitosa
- ✅ Registra logs de cada ejecución
- ✅ Permite ejecución manual desde GitHub

## Configuración

### Paso 1: Agregar Secrets a GitHub

1. Ve al repositorio en GitHub
2. Click en **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**

Agrega estos secrets:

#### Secret 1: CRON_TOKEN (Requerido)

| Campo | Valor |
|-------|-------|
| **Name** | `CRON_TOKEN` |
| **Secret** | El valor de `CRON_TOKEN` en tu `.env` |
| **Ejemplo** | `fuel-watch-sync-secret-123` |

#### Secret 2: SYNC_URL (Opcional pero recomendado)

| Campo | Valor |
|-------|-------|
| **Name** | `SYNC_URL` |
| **Secret** | Tu dominio completo (con https://) |
| **Ejemplo** | `https://fuel-watch.andres.dev` |

**¿Por qué son secrets?**
- `CRON_TOKEN`: Es secreto, no debe estar visible en el código
- `SYNC_URL`: Opcional, pero útil si cambias de dominio sin editar el código

### Paso 2: Verificar que el workflow está activo

1. En tu repositorio, ve a **Actions**
2. Deberías ver "Sync Fuel Prices" en la lista
3. Si está deshabilitado (gris), click en **Enable workflow**

### Paso 3: Probar el workflow manualmente

1. Ve a **Actions**
2. Selecciona **Sync Fuel Prices**
3. Click en **Run workflow** → **Run workflow**
4. Espera unos segundos y verifica que sea verde ✅

## Resultados

### Ejecución Exitosa ✅

```
HTTP Status: 200
Response: {"success":true,"count":12051}
✅ Sync successful! Updated 12051 stations
```

### Ejecución Fallida ❌

```
HTTP Status: 401
Response: {"error":"Unauthorized"}
❌ Sync failed with HTTP 401
```

**Causas comunes:**
- `401 Unauthorized`: Token inválido o no configurado
- `404 Not Found`: URL incorrecta
- `500 Internal Error`: Problema en el servidor/BD

## Cronograma

Por defecto se ejecuta:

```yaml
- cron: '0 * * * *'  # Cada hora a las :00 minutos
```

### Cambiar la frecuencia

Edita `.github/workflows/sync-fuel-prices.yml`:

| Frecuencia | Cron Expression |
|-----------|-----------------|
| Cada hora | `0 * * * *` |
| Cada 30 min | `*/30 * * * *` |
| Cada 15 min | `*/15 * * * *` |
| Una vez al día | `0 0 * * *` |
| Lunes-Viernes 8 AM | `0 8 * * 1-5` |
| Cada 6 horas | `0 0,6,12,18 * * *` |

**Nota**: GitHub Actions ejecuta con UTC. Si necesitas otra zona horaria, suma/resta las horas.

## Monitoreo y Logs

### Ver logs de ejecuciones

1. Ve a **Actions**
2. Click en **Sync Fuel Prices**
3. Selecciona la ejecución más reciente
4. Revisa los detalles en **Sync fuel prices**

### Logs típicos

```
Starting fuel price synchronization...
Target: https://tu-dominio.com/api/update-prices
HTTP Status: 200
Response: {"success":true,"count":12051}
✅ Sync successful! Updated 12051 stations
```

## Troubleshooting

### El workflow no aparece en Actions

- Verifica que el archivo está en `.github/workflows/sync-fuel-prices.yml`
- Haz push a la rama `main`
- Espera unos segundos y recarga GitHub

### El workflow está deshabilitado

- Ve a **Actions**
- Click en **I understand my workflows, go ahead and enable them**

### El workflow falla con 401

**Solución:**
1. Ve a **Settings** → **Secrets and variables** → **Actions**
2. Verifica que `CRON_TOKEN` está correcto
3. Compara con el valor en tu `.env` local
4. Ejecuta manualmente el workflow: **Run workflow**

### El workflow falla con 404 (Not Found)

**Solución:**
1. Verifica que tu dominio es correcto
2. Agrega el secret `SYNC_URL` con tu dominio real
3. Ejemplo: `https://fuel-watch.pages.dev` (sin trailing slash)

### El workflow falla por timeout

- El servidor tardó más de lo esperado
- Intenta ejecutar manualmente: `curl "https://tu-dominio.com/api/update-prices?token=..."`
- Verifica que el API del Ministerio está disponible

## Ejecución Manual

Para ejecutar la sincronización manualmente desde GitHub (sin esperar a la próxima ejecución):

1. Ve a **Actions**
2. Selecciona **Sync Fuel Prices**
3. Click en **Run workflow**
4. Click en **Run workflow** (confirmar)
5. Espera a que complete (generalmente 30 segundos)

## Variables de Entorno en el Workflow

El workflow usa:

```yaml
CRON_TOKEN=${{ secrets.CRON_TOKEN }}           # De los secrets de GitHub
SYNC_URL=${{ secrets.SYNC_URL }}               # De los secrets (opcional)
```

**No necesitas cambiar nada en el código**, GitHub automáticamente inyecta estos valores.

## Seguridad

### ¿Es seguro guardar el token en GitHub Secrets?

**Sí**. GitHub Secrets:
- ✅ Se encriptan automáticamente
- ✅ Nunca aparecen en logs
- ✅ Solo accesibles por el propietario del repo
- ✅ No se muestran en acciones ejecutadas

### ¿Puedo cambiar el token si está comprometido?

**Sí**:
1. Ve a tu `.env` local y cambia `CRON_TOKEN`
2. Deploy el cambio a producción
3. En GitHub, ve a **Settings** → **Secrets** → edita `CRON_TOKEN`
4. Guarda el nuevo valor

## Próximos Pasos

Después de configurar:

1. ✅ Agrega los secrets a GitHub
2. ✅ Verifica que el workflow está activo
3. ✅ Ejecuta manualmente una vez para probar
4. ✅ Revisa los logs para confirmar que funciona
5. ✅ El workflow se ejecutará automáticamente cada hora

## Ayuda Adicional

- [Documentación de GitHub Actions](https://docs.github.com/en/actions)
- [Secrets en GitHub Actions](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [Expresiones Cron](https://crontab.guru/)
