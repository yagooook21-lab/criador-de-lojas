const fs = require('fs');
const filePath = 'c:/Users/igore/Desktop/metarat/src/pages/StoreCheckoutPixSuccess.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `                        trackPurchase(finalAmount, "BRL", cartItems.map((i: any) => ({
                            product_id: i.product.id,
                            name: i.product.name,
                            quantity: i.quantity,
                            price: i.product.price
                        })));`;

const replacementStr = `                        trackPurchase(finalAmount, "BRL", cartItems.map((i: any) => ({
                            product_id: i.product.id,
                            name: i.product.name,
                            quantity: i.quantity,
                            price: i.product.price
                        })));
                        
                        // Integracao Voxuy
                        supabase.from("settings").select("value").eq("key", "communication_settings").single().then(({ data }) => {
                            if (data?.value) {
                                const commSet = data.value as any;
                                if (commSet.wa_enabled && commSet.wa_api_url) {
                                    fetch(commSet.wa_api_url, {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            ...(commSet.wa_api_key ? { "Authorization": "Bearer " + commSet.wa_api_key } : {})
                                        },
                                        body: JSON.stringify({
                                            event: "order_created",
                                            order_id: order?.id || order?.order_number || "",
                                            customer_name: addressData?.name || localStorage.getItem("checkout_name") || "Cliente",
                                            customer_phone: addressData?.phone || "",
                                            customer_email: addressData?.email || localStorage.getItem("store_user_email") || "",
                                            payment_method: "pix",
                                            status: "pending",
                                            total: finalAmount,
                                            pix_code: resultPayload
                                        })
                                    }).catch(e => console.error("Erro Voxuy:", e));
                                }
                            }
                        }).catch(console.error);`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('File patched successfully');
} else {
    console.log('Target string not found');
}
