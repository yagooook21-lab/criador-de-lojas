import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL="(.*?)"/)[1];
const SUPABASE_KEY = envFile.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  console.log("Conectando ao banco de dados no Supabase...");
  const { data, error } = await supabase.from('settings').select('*');
  if (error) {
    console.error('Erro ao buscar as configurações:', error);
  } else {
    console.log("Configurações encontradas no banco:");
    console.log(JSON.stringify(data, null, 2));
  }
}
check();
