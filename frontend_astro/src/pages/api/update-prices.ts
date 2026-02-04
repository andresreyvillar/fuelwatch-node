import type { APIRoute } from 'astro';
import { updateDataFromMinistry } from '../../lib/fuel';

export const GET: APIRoute = async () => {
  try {
    // Endpoint for syncing fuel prices from Ministry API to Supabase
    // Called hourly by GitHub Actions workflow
    console.log('[update-prices] Starting fuel price synchronization');
    const result = await updateDataFromMinistry();
    console.log('[update-prices] Sync completed:', result);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[update-prices] Error during sync:', error);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
