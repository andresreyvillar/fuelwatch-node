import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vmcvdpocewzaxqlzldbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtY3ZkcG9jZXd6YXhxbHpsZGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTc4NzMsImV4cCI6MjA4NTczMzg3M30.wtbJ5zTTAHQjHfIgfGZYurGnwpbiaGqOChw6wvIzzRE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Searching for Madrid...');
  const { data, count, error } = await supabase
    .from('servicestations')
    .select('*', { count: 'exact' })
    .or('localidad.ilike.%Madrid%,cp.ilike.%Madrid%')
    .limit(5);

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success! Found:', count);
    console.log('First result:', data?.[0]?.rotulo, data?.[0]?.localidad);
  }
}

test();
