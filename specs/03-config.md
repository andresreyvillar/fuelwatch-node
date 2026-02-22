# 03 - Configuracion

## Astro Config (`astro.config.mjs`)

```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',                    // SSR mode
  vite: {
    plugins: [tailwindcss()]           // Tailwind v4 via Vite plugin
  },
  integrations: [react()],            // React para componentes interactivos
  adapter: cloudflare()               // Deploy a Cloudflare Pages
});
```

## TypeScript (`tsconfig.json`)

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

## Dependencias (`package.json`)

```json
{
  "name": "frontend_astro",
  "type": "module",
  "dependencies": {
    "@astrojs/cloudflare": "^12.6.12",
    "@astrojs/react": "^4.4.2",
    "@supabase/supabase-js": "^2.94.0",
    "@tailwindcss/vite": "^4.1.18",
    "@types/react": "^19.2.10",
    "@types/react-dom": "^19.2.3",
    "astro": "^5.17.1",
    "lucide-react": "^0.563.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "recharts": "^3.7.0",
    "tailwindcss": "^4.1.18"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

## Cloudflare Pages (`wrangler.toml`)

```toml
pages_build_output_dir = "dist"
name = "fuel-watch"
compatibility_flags = ["nodejs_compat"]
```

## Variables de Entorno

| Variable | Uso | Donde |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | URL de Supabase | .env / Cloudflare |
| `PUBLIC_SUPABASE_ANON_KEY` | Clave publica (anon) | .env / Cloudflare |

**Nota**: En produccion (Cloudflare Pages SSR), las env vars no se inyectan en runtime. Por eso el cliente Supabase tiene las credenciales publicas hardcodeadas en `supabase.ts`. La ANON_KEY es segura para exponer (solo permite operaciones con RLS habilitado).

## CI/CD - GitHub Actions

Workflow de sincronizacion horaria de precios:

```yaml
name: Update Fuel Prices
on:
  schedule:
    - cron: '0 * * * *'          # Cada hora
  workflow_dispatch:               # Manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger price update
        run: |
          curl -s "https://fuel-watch.pages.dev/api/update-prices"
```

El endpoint `/api/update-prices` no requiere autenticacion actualmente. El `CRON_TOKEN` existe en .env pero no se usa en el endpoint.
