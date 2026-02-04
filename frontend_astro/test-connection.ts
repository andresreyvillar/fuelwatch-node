import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vmcvdpocewzaxqlzldbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtY3ZkcG9jZXd6YXhxbHpsZGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTc4NzMsImV4cCI6MjA4NTczMzg3M30.wtbJ5zTTAHQjHfIgfGZYurGnwpbiaGqOChw6wvIzzRE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing connection...');
  const { data, error, count } = await supabase
    .from('servicestations')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
  } else {
    console.log('Success! Count:', count);
  }
}

test();
