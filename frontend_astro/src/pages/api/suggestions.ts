import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get('q') || '';
  if (query.length < 2) return new Response(JSON.stringify([]));

  try {
    const articles = ['A ', 'O ', 'LA ', 'EL ', 'LOS ', 'LAS ', 'AS ', 'OS '];
    // Escape parentheses for Supabase .or() filter
    const safeQuery = query.replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    let orConditions = [`localidad.ilike.%${safeQuery}%` ];

    const upperQuery = query.toUpperCase();
    for (const art of articles) {
      if (upperQuery.startsWith(art)) {
        const mainName = query.slice(art.length).trim();
        // Format for DB: "NAME (ART)". Escape parentheses here too.
        const escapedArt = art.trim().replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        orConditions.push(`localidad.ilike.%${mainName}%${escapedArt}%`);
      }
    }

    const { data, error } = await supabase
      .from('servicestations')
      .select('localidad')
      .or(orConditions.join(','))
      .limit(100);

    if (error) throw error;

    const uniqueLocations = Array.from(new Set(data.map(item => item.localidad))).sort();

    return new Response(JSON.stringify(uniqueLocations.slice(0, 10)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
