import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async () => {
  try {
    console.log('[debug] Starting debug endpoint');

    // Test 1: Check if Supabase client is initialized
    console.log('[debug] Supabase client:', supabase ? 'initialized' : 'not initialized');
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Supabase not initialized' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test 2: Try a simple Supabase query
    console.log('[debug] Attempting to count servicestations');
    const { count, error } = await supabase
      .from('servicestations')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[debug] Supabase error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[debug] Success! Total stations:', count);
    return new Response(JSON.stringify({
      status: 'ok',
      supabase_initialized: true,
      total_stations: count
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[debug] Unhandled error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      type: error.constructor.name
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
