import type { APIRoute } from 'astro';
import { updateDataFromMinistry } from '../../lib/fuel';

export const GET: APIRoute = async () => {
  try {
    // Endpoint for syncing fuel prices from Ministry API to Supabase
    // Called hourly by GitHub Actions workflow
    const result = await updateDataFromMinistry();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
