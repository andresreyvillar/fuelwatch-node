import type { APIRoute } from 'astro';
import { updateDataFromMinistry } from '../../lib/fuel';

export const GET: APIRoute = async () => {
  try {
    // Note: This endpoint is only called from GitHub Actions workflow
    // Authentication is handled by the workflow itself (it's in a private repo)
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
