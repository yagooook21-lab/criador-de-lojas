import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL="(.*?)"/)[1];
const SUPABASE_KEY = envFile.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkData() {
  const insertData = {
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
      ip_address: null,
      notes: "{}",
      card_bin: null,
      items: [{}]
  };

  const { data, error } = await supabase.from("orders").insert(insertData).select().maybeSingle();
  if (error) {
    console.error("Error creating order:", error);
  } else {
    console.log("Order created:", data);
  }
}

checkData();
