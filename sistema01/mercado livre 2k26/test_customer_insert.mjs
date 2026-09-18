import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL="(.*?)"/)[1];
const SUPABASE_KEY = envFile.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testCustomer() {
  console.log("Testing anon customer insert...");
  const { error } = await supabase.from("customers").insert({
      name: "Anon",
      email: "anon@test.com",
      total_orders: 1,
      total_spent: 100
  });
  console.log("Anon customer insert error?", error);
}

testCustomer();
