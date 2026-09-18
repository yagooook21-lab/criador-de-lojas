const fs = require('fs');

const pixPath = 'c:/Users/igore/Desktop/metarat/src/pages/StoreCheckoutPixSuccess.tsx';
const bolPath = 'c:/Users/igore/Desktop/metarat/src/pages/StoreCheckoutBoletoSuccess.tsx';

let pixCode = fs.readFileSync(pixPath, 'utf8');
let bolCode = fs.readFileSync(bolPath, 'utf8');

const targetPixPayload = `                                        body: JSON.stringify({
                                            event: "order_created",
                                            order_id: order?.id || order?.order_number || "",
                                            customer_name: addressData?.name || localStorage.getItem("checkout_name") || "Cliente",
                                            customer_phone: addressData?.phone || "",
                                            customer_email: addressData?.email || localStorage.getItem("store_user_email") || "",
                                            payment_method: "pix",
                                            status: "pending",
                                            total: finalAmount,
                                            pix_code: resultPayload
                                        })`;

const targetBolPayload = `                                        body: JSON.stringify({
                                            event: "order_created",
                                            order_id: order?.id || order?.order_number || "",
                                            customer_name: addressData?.name || localStorage.getItem("checkout_name") || "Cliente",
                                            customer_phone: addressData?.phone || "",
                                            customer_email: addressData?.email || localStorage.getItem("store_user_email") || "",
                                            payment_method: "boleto",
                                            status: "pending",
                                            total: finalAmount,
                                            boleto_code: finalCode
                                        })`;

const replacementPixPayload = `                                        body: JSON.stringify({
                                            event: "order_created",
                                            id_pedido: order?.id || order?.order_number || "",
                                            order_id: order?.id || order?.order_number || "",
                                            nome: addressData?.name || localStorage.getItem("checkout_name") || "Cliente",
                                            telefone: addressData?.phone || "",
                                            email: addressData?.email || localStorage.getItem("store_user_email") || "",
                                            valor: finalAmount,
                                            total: finalAmount,
                                            metodo_pagamento: "pix",
                                            status: "pending",
                                            codigo_pix: resultPayload,
                                            linha_digitavel: resultPayload,
                                            token: commSet.wa_api_key || "",
                                            api_key: commSet.wa_api_key || ""
                                        })`;

const replacementBolPayload = `                                        body: JSON.stringify({
                                            event: "order_created",
                                            id_pedido: order?.id || order?.order_number || "",
                                            order_id: order?.id || order?.order_number || "",
                                            nome: addressData?.name || localStorage.getItem("checkout_name") || "Cliente",
                                            telefone: addressData?.phone || "",
                                            email: addressData?.email || localStorage.getItem("store_user_email") || "",
                                            valor: finalAmount,
                                            total: finalAmount,
                                            metodo_pagamento: "boleto",
                                            status: "pending",
                                            linha_digitavel: finalCode,
                                            codigo_pix: finalCode,
                                            token: commSet.wa_api_key || "",
                                            api_key: commSet.wa_api_key || ""
                                        })`;

let pixNew = pixCode.replace(targetPixPayload, replacementPixPayload);
let bolNew = bolCode.replace(targetBolPayload, replacementBolPayload);

fs.writeFileSync(pixPath, pixNew, 'utf8');
fs.writeFileSync(bolPath, bolNew, 'utf8');

console.log("PIX Patched:", pixCode !== pixNew);
console.log("BOL Patched:", bolCode !== bolNew);
