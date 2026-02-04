import { searchStations } from './src/lib/fuel';

async function test() {
  console.log('Testing searchStations with "Madrid"...');
  try {
    const result = await searchStations('Madrid', 1, 20);
    console.log('Results count:', result.data.length);
    console.log('Total:', result.meta.total);
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
