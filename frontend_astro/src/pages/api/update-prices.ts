import type { APIRoute } from 'astro';
import { updateDataFromMinistry } from '../../lib/fuel';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Validate token
    const token = new URL(request.url).searchParams.get('token');
    // Use process.env for private variables in Cloudflare Pages
    const validToken = process.env.CRON_TOKEN;

    if (!token || token !== validToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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
