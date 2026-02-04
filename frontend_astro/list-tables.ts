import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vmcvdpocewzaxqlzldbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtY3ZkcG9jZXd6YXhxbHpsZGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTc4NzMsImV4cCI6MjA4NTczMzg3M30.wtbJ5zTTAHQjHfIgfGZYurGnwpbiaGqOChw6wvIzzRE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Listing tables...');
  // PostgREST doesn't have a direct way to list tables via the JS client easily
  // but we can try to query the schema if permissions allow, or just test known names.
  
  const tables = ['servicestations', 'historico', 'stations', 'price_history'];
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`Table "${table}": ERROR (${error.message})`);
    } else {
      console.log(`Table "${table}": OK (Count: ${count})`);
    }
  }
}

test();
