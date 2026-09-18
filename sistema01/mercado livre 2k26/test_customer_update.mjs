import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL="(.*?)"/)[1];
const SUPABASE_KEY = envFile.match(/SUPABASE_SERVICE_ROLE_KEY="(.*?)"/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testUpdate() {
  console.log("Testing anon customer update...");
  const { data: custs } = await supabase.from("customers").select("id").limit(1);
  if (custs && custs.length > 0) {
    const { error } = await supabase.from("customers").update({ name: "Updated" }).eq("id", custs[0].id);
    console.log("Anon customer update error?", error);
  } else {
    console.log("No customers to update");
  }
}

testUpdate();
