import type { APIRoute } from 'astro';
import { getSuggestions } from '../../lib/fuel';

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get('q') || '';

  try {
    const suggestions = await getSuggestions(query);
    return new Response(JSON.stringify(suggestions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
