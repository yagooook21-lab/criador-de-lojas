import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL="(.*?)"/)[1];
const SUPABASE_KEY = envFile.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tablesToCheck = [
  'products',
  'orders',
  'customers',
  'settings',
  'live_visitors',
  'carts',
  'collections',
  'store_credentials',
  'checkout_cards',
  'notifications',
  'license_keys',
  'site_stats'
];

async function checkTables() {
  console.log("Verificando tabelas no novo Supabase...");
  for (const table of tablesToCheck) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`❌ Tabela '${table}' não encontrada ou erro: ${error.message}`);
    } else {
      console.log(`✅ Tabela '${table}' existe.`);
    }
  }
}

checkTables();
