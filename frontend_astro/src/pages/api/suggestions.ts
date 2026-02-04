import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get('q') || '';
  if (query.length < 2) return new Response(JSON.stringify([]));

  try {
    const { data, error } = await supabase
      .from('servicestations')
      .select('localidad')
      .ilike('localidad', `%${query}%`)
      .limit(10);

    if (error) throw error;

    const uniqueLocations = Array.from(new Set(data.map(item => item.localidad))).sort();

    return new Response(JSON.stringify(uniqueLocations), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
