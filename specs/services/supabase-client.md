# Service: Supabase Client

## Archivo: `src/lib/supabase.ts`

## Proposito

Crea y exporta una instancia unica del cliente Supabase para toda la aplicacion.

## Implementacion

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vmcvdpocewzaxqlzldbu.supabase.co';
const supabaseKey = '<ANON_KEY_JWT>';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

## Credenciales

- **URL**: `https://vmcvdpocewzaxqlzldbu.supabase.co`
- **Key**: ANON_KEY publica (segura para exponer en cliente)
- **Hardcoded**: Si, porque Cloudflare Pages no inyecta env vars en SSR runtime

## Export

| Nombre | Tipo | Descripcion |
|--------|------|-------------|
| `supabase` | SupabaseClient | Instancia del cliente |

## Uso

Importado en:
- `lib/fuel.ts` (todas las funciones de negocio)
- `pages/api/suggestions.ts` (directamente)

## Nota sobre seguridad

La ANON_KEY solo permite operaciones permitidas por las Row Level Security (RLS) policies de Supabase. Las tablas `servicestations` y `price_history` tienen RLS configurado para permitir lectura publica y escritura desde el cliente con la anon key (necesario para el sync).
