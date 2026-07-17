import { supabase } from './src/lib/supabase.ts';
async function run() {
  const { data, error } = await supabase.from('workshops').select('*, workshop_categories!workshops_category_id_fkey(*)').limit(1);
  if (error) console.error('WORKSHOPS ERROR:', error); else console.log('WORKSHOPS OK, keys:', Object.keys(data[0] || {}));
}
run();
