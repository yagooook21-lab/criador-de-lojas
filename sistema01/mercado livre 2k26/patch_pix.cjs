const fs = require('fs');
const pixPath = 'c:/Users/igore/Desktop/metarat/src/pages/StoreCheckoutPixSuccess.tsx';
let pixCode = fs.readFileSync(pixPath, 'utf8');

const start = pixCode.indexOf('body: JSON.stringify({');
const end = pixCode.indexOf('})', start) + 2;
const target = pixCode.substring(start, end);

const replacement = `body: JSON.stringify({
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

pixCode = pixCode.replace(target, replacement);
fs.writeFileSync(pixPath, pixCode, 'utf8');
console.log('Patched PIX!');
