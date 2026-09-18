import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL="(.*?)"/)[1];
const SUPABASE_KEY = envFile.match(/SUPABASE_SERVICE_ROLE_KEY="(.*?)"/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkPolicies() {
  const { data, error } = await supabase.rpc('get_policies');
  if (error) {
    // If rpc doesn't exist, try querying pg_policies via REST, but that's not exposed by default.
    // Let's try executing SQL directly using rest /rpc if available, but without it we can just disable RLS or add policy.
    console.error("RPC Error:", error.message);
  } else {
    console.log("Policies:", data);
  }
}

async function tryBypass() {
    // We can also just insert using service_role and check if it succeeds
    console.log("Testing service role insert...");
    const { error } = await supabase.from("orders").insert({
        order_number: `ORD-${Date.now()}`,
        customer_name: "Cliente",
        customer_email: "sem-email@loja.com",
        customer_phone: "",
        shipping_address: "",
        shipping_city: "",
        shipping_state: "",
        shipping_zip: "",
        shipping_country: "BR",
        total: 100,
        subtotal: 100,
        shipping_cost: 0,
        discount: 0,
        status: "pending",
        payment_method: "pix",
        payment_status: "pending",
        items: [{}]
    });
    console.log("Service role insert error?", error);
}

tryBypass();
