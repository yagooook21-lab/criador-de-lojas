import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL="(.*?)"/)[1];
const SUPABASE_KEY = envFile.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkData() {
  console.log("Verificando dados iniciais...");
  
  const { data: licenseKeys } = await supabase.from('license_keys').select('key');
  console.log("Chaves de licença:", licenseKeys);

  const { data: stats } = await supabase.from('site_stats').select('*');
  console.log("Site Stats:", stats);

  const { data: settings } = await supabase.from('settings').select('*');
  console.log("Settings:", settings);

  const { data: products } = await supabase.from('products').select('id').limit(1);
  console.log("Possui produtos?", products?.length > 0 ? "Sim" : "Não");

  // Check storage
  const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
  if (storageError) {
    console.error("Erro ao listar buckets:", storageError);
  } else {
    console.log("Buckets encontrados:", buckets.map(b => b.name));
  }
}

checkData();
