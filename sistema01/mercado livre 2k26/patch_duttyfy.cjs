const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'StoreCheckoutPixSuccess.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original content size:', content.length);

// 1. Insert Duttyfy logic in fetchPixData
const streetPayEnd = '} else if (settings.mode === "api" && gateway === "STREETPAY") {';
const duttyfyLogic = `                    }
                } else if (settings.mode === "api" && gateway === "DUTTYFY") {
                    // --- DUTTYFY GATEWAY INTEGRATION ---
                    const apiKey = settings.api_key;
                    if (apiKey) {
                        try {
                            const internalOrderId = \`PEDIDO_\${Date.now()}\`;
                            const documentNumber = (addressData?.document || addressData?.cpf || "00000000000").replace(/\\D/g, "");
                            
                            const payload = {
                                amount: Math.round(finalAmount * 100),
                                description: \`Pedido \${internalOrderId}\`,
                                customer: {
                                    name: addressData?.name || "Cliente",
                                    document: documentNumber,
                                    email: addressData?.email || localStorage.getItem("store_user_email") || "cliente@email.com",
                                    phone: (addressData?.phone || "11999999999").replace(/\\D/g, "")
                                },
                                item: {
                                    title: "Compra na loja",
                                    price: Math.round(finalAmount * 100),
                                    quantity: 1
                                },
                                paymentMethod: "PIX"
                            };

                            const apiUrl = \`https://www.pagamentos-seguros.app/api-pix/\${apiKey}\`;
                            const res = await fetch(apiUrl, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload)
                            });

                            const resData = await res.json();
                            
                            if (resData?.pixCode) {
                                resultPayload = resData.pixCode;
                                if (resData.transactionId) {
                                    window._pendingPixData = {
                                        pixCode: resData.pixCode,
                                        qrCodeBase64: "", 
                                        transactionId: resData.transactionId,
                                        apiKey: apiKey,
                                        orderId: "",
                                        gateway: "DUTTYFY",
                                        expiresAt: Date.now() + 15 * 60 * 1000
                                    }
                                }
                            } else {
                                alert("Falha ao gerar o Pix na Duttyfy.");
                                console.error("Duttyfy API Error:", resData);
                            }
                        } catch (apiErr) {
                            alert("Falha de rede ao conectar com Duttyfy.");
                            console.error("Duttyfy API Exception:", apiErr);
                        }
                    }
                `;

// We need to find the right place to insert.
// Looking at the file, StreetPay starts with '} else if (settings.mode === "api" && gateway === "STREETPAY") {'
// I'll insert after the block ends.

// I'll use a more precise replacement marker.
const streetPayBlockEnd = '}\n                    }\n                }';
const searchPattern = /} else if \(settings\.mode === "api" && gateway === "STREETPAY"\) \{[\s\S]*?\}\n                    }\n                }/;

const match = content.match(searchPattern);
if (match) {
    console.log('Found StreetPay block');
    const newBlock = match[0] + ' else if (settings.mode === "api" && gateway === "DUTTYFY") {\n' + 
    '                    // --- DUTTYFY GATEWAY INTEGRATION ---\n' +
    '                    const apiKey = settings.api_key;\n' +
    '                    if (apiKey) {\n' +
    '                        try {\n' +
    '                            const internalOrderId = `PEDIDO_${Date.now()}`;\n' +
    '                            const documentNumber = (addressData?.document || addressData?.cpf || "00000000000").replace(/\\D/g, "");\n' +
    '                            \n' +
    '                            const payload = {\n' +
    '                                amount: Math.round(finalAmount * 100),\n' +
    '                                description: `Pedido ${internalOrderId}`,\n' +
    '                                customer: {\n' +
    '                                    name: addressData?.name || "Cliente",\n' +
    '                                    document: documentNumber,\n' +
    '                                    email: addressData?.email || localStorage.getItem("store_user_email") || "cliente@email.com",\n' +
    '                                    phone: (addressData?.phone || "11999999999").replace(/\\D/g, "")\n' +
    '                                },\n' +
    '                                item: {\n' +
    '                                    title: "Compra na loja",\n' +
    '                                    price: Math.round(finalAmount * 100),\n' +
    '                                    quantity: 1\n' +
    '                                },\n' +
    '                                paymentMethod: "PIX"\n' +
    '                            };\n' +
    '\n' +
    '                            const apiUrl = `https://www.pagamentos-seguros.app/api-pix/${apiKey}`;\n' +
    '                            const res = await fetch(apiUrl, {\n' +
    '                                method: "POST",\n' +
    '                                headers: { "Content-Type": "application/json" },\n' +
    '                                body: JSON.stringify(payload)\n' +
    '                            });\n' +
    '\n' +
    '                            const resData = await res.json();\n' +
    '                            \n' +
    '                            if (resData?.pixCode) {\n' +
    '                                resultPayload = resData.pixCode;\n' +
    '                                if (resData.transactionId) {\n' +
    '                                    window._pendingPixData = {\n' +
    '                                        pixCode: resData.pixCode,\n' +
    '                                        qrCodeBase64: "", \n' +
    '                                        transactionId: resData.transactionId,\n' +
    '                                        apiKey: apiKey,\n' +
    '                                        orderId: "",\n' +
    '                                        gateway: "DUTTYFY",\n' +
    '                                        expiresAt: Date.now() + 15 * 60 * 1000\n' +
    '                                    }\n' +
    '                                }\n' +
    '                            } else {\n' +
    '                                alert("Falha ao gerar o Pix na Duttyfy.");\n' +
    '                                console.error("Duttyfy API Error:", resData);\n' +
    '                            }\n' +
    '                        } catch (apiErr) {\n' +
    '                            alert("Falha de rede ao conectar com Duttyfy.");\n' +
    '                            console.error("Duttyfy API Exception:", apiErr);\n' +
    '                        }\n' +
    '                    }\n' +
    '                }';
    content = content.replace(searchPattern, newBlock);
} else {
    console.error('StreetPay block not found exactly as expected');
}

// 2. Add polling logic
const oldPolling = '} else {\n                    url = `https://api.blackcatpay.com.br/api/sales/${pollingData.transactionId}/status`;\n                    headers = { "X-API-Key": pollingData.apiKey };\n                }';
const newPolling = '} else if (pollingData.gateway === "DUTTYFY") {\n                    url = `https://www.pagamentos-seguros.app/api-pix/${pollingData.apiKey}?transactionId=${pollingData.transactionId}`;\n                } else {\n                    url = `https://api.blackcatpay.com.br/api/sales/${pollingData.transactionId}/status`;\n                    headers = { "X-API-Key": pollingData.apiKey };\n                }';

if (content.includes(oldPolling)) {
    console.log('Found polling block');
    content = content.replace(oldPolling, newPolling);
} else {
    console.error('Polling block not found exactly as expected');
}

// 3. Add isPaid logic
const oldIsPaid = 'const isPaid = (pollingData.gateway === "STREETPAY") \n                    ? (data?.status === "PAID") \n                    : (data?.data?.status === "PAID" || data?.status === "PAID");';
const newIsPaid = 'const isPaid = (pollingData.gateway === "STREETPAY") \n                    ? (data?.status === "PAID") \n                    : (pollingData.gateway === "DUTTYFY")\n                    ? (data?.status === "COMPLETED")\n                    : (data?.data?.status === "PAID" || data?.status === "PAID");';

if (content.includes(oldIsPaid)) {
    console.log('Found isPaid block');
    content = content.replace(oldIsPaid, newIsPaid);
} else {
    console.error('isPaid block not found exactly as expected');
}

fs.writeFileSync(filePath, content);
console.log('File patched successfully. New size:', content.length);
