import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL="(.*?)"/)[1];
const SUPABASE_KEY = envFile.match(/SUPABASE_SERVICE_ROLE_KEY="(.*?)"/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testSelect() {
  console.log("Testing anon orders select...");
  const { data, error } = await supabase.from("orders").select("id").limit(1);
  console.log("Anon orders select error?", error);
  console.log("Anon orders select data?", data);
}

testSelect();
