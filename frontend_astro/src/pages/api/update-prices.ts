import type { APIRoute } from 'astro';
import { updateDataFromMinistry } from '../../lib/fuel';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Debug: Check if CRON_TOKEN is available
    const token = new URL(request.url).searchParams.get('token');
    const validToken = process.env.CRON_TOKEN;

    console.log('[DEBUG] Token from request:', token ? '***' : 'missing');
    console.log('[DEBUG] CRON_TOKEN env var exists:', !!validToken);
    console.log('[DEBUG] CRON_TOKEN value:', validToken ? '***' : 'undefined');
    console.log('[DEBUG] All env vars:', Object.keys(process.env).filter(k => k.includes('TOKEN') || k.includes('CRON')));

    if (!token || token !== validToken) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        debug: {
          tokenReceived: !!token,
          envVarExists: !!validToken,
          envVarValue: validToken ? 'configured' : 'missing'
        }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
