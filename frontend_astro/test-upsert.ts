import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vmcvdpocewzaxqlzldbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtY3ZkcG9jZXd6YXhxbHpsZGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTc4NzMsImV4cCI6MjA4NTczMzg3M30.wtbJ5zTTAHQjHfIgfGZYurGnwpbiaGqOChw6wvIzzRE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing upsert...');
  const { data, error } = await supabase
    .from('servicestations')
    .upsert({
      id_ss: 999999, // Fake ID
      rotulo: 'TEST STATION',
      horario: '24H',
      fecha_actualizacion: new Date().toISOString(),
      cp: '00000',
      direccion: 'TEST',
      localidad: 'TEST',
      provincia: 'TEST',
      latitud: '0',
      longitud: '0'
    }, { onConflict: 'id_ss' });

  if (error) {
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Details:', error.details);
  } else {
    console.log('Upsert successful!');
    
    // Cleanup
    console.log('Cleaning up...');
    await supabase.from('servicestations').delete().eq('id_ss', 999999);
  }
}

test();
