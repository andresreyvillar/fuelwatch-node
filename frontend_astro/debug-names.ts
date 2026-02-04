import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vmcvdpocewzaxqlzldbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtY3ZkcG9jZXd6YXhxbHpsZGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTc4NzMsImV4cCI6MjA4NTczMzg3M30.wtbJ5zTTAHQjHfIgfGZYurGnwpbiaGqOChw6wvIzzRE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log('Fetching sample locations for ESTRADA and CORUÑA...');
  const { data, error } = await supabase
    .from('servicestations')
    .select('localidad')
    .or('localidad.ilike.%ESTRADA%,localidad.ilike.%CORUÑA%')
    .limit(20);

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Exact values found in DB:');
    const unique = Array.from(new Set(data.map(d => d.localidad)));
    unique.forEach(l => console.log(`- "${l}"`));
  }
}

debug();
