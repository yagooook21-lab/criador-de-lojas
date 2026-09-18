const fs = require('fs');
const filePath = 'c:\\Users\\igore\\OneDrive\\Área de Trabalho\\metarat beta\\nova-merchant-hub\\src\\pages\\StoreCheckoutPixSuccess.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const insert0Search = `const qrBase64 = matchBase64 || resData?.data?.paymentData?.qrCodeBase64 || resData?.qrCodeBase64;`;

const insert0Replace = `const qrBase64 = matchBase64 || resData?.data?.paymentData?.qrCodeBase64 || resData?.qrCodeBase64;
                                let localTxId = resData?.data?.transactionId || resData?.transactionId || "";
                                let localApiKey = apiKey;
                                
                                if (localTxId && gateway === "BLACK CAT") {
                                    window._pendingPixData = {
                                        pixCode: copyPaste || foundPix || "",
                                        qrCodeBase64: qrBase64 || "",
                                        transactionId: localTxId,
                                        apiKey: localApiKey,
                                        orderId: "",
                                        expiresAt: Date.now() + 15 * 60 * 1000
                                    }
                                }`;
content = content.replace(insert0Search, insert0Replace);

const insert4Search = `                        trackPurchase(finalAmount, "BRL", cartItems.map((i: any) => ({
                            product_id: i.product.id,
                            name: i.product.name,
                            quantity: i.quantity,
                            price: i.product.price
                        })));
                    }).catch(console.error);`;

const insert4Replace = `                        trackPurchase(finalAmount, "BRL", cartItems.map((i: any) => ({
                            product_id: i.product.id,
                            name: i.product.name,
                            quantity: i.quantity,
                            price: i.product.price
                        })));
                        
                        if (window._pendingPixData) {
                            window._pendingPixData.orderId = order?.id || order?.order_number || "";
                            sessionStorage.setItem("blackcat_pix_state", JSON.stringify(window._pendingPixData));
                            setPollingData(window._pendingPixData);
                            delete window._pendingPixData;
                        }
                    }).catch(console.error);`;
content = content.replace(insert4Search, insert4Replace);

const insert5Search = `    useEffect(() => {
        return () => {
            document.body.removeAttribute("data-site");`;

const insert5Replace = `    useEffect(() => {
        if (!pollingData?.transactionId || !pollingData?.apiKey || paymentConfirmed) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(\`https://api.blackcatpay.com.br/api/sales/\${pollingData.transactionId}/status\`, {
                    headers: { "X-API-Key": pollingData.apiKey }
                });
                const data = await res.json();
                if (data?.data?.status === "PAID" || data?.status === "PAID") {
                    setPaymentConfirmed(true);
                    sessionStorage.removeItem("blackcat_pix_state");
                    clearInterval(interval);
                    
                    setTimeout(() => {
                        if (pollingData.orderId) {
                            navigate(\`/rastro-code/\${pollingData.orderId}\`);
                        } else {
                            navigate("/store");
                        }
                    }, 3000);
                }
            } catch (e) {}
        }, 10000);

        return () => clearInterval(interval);
    }, [pollingData, paymentConfirmed, navigate]);

    useEffect(() => {
        return () => {
            document.body.removeAttribute("data-site");`;

content = content.replace(insert5Search, insert5Replace);

const insert6Search = `    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'`;

const insert6Replace = `    if (paymentConfirmed) {
        return (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 }}>
                <div style={{ background: "#fff", padding: "40px", borderRadius: "16px", textAlign: "center", maxWidth: "400px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                    <div style={{ width: "80px", height: "80px", background: "#E8F5E9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <h2 style={{ fontSize: "24px", color: "#333", marginBottom: "16px", fontWeight: 700 }}>Pagamento Confirmado!</h2>
                    <p style={{ fontSize: "16px", color: "#666", lineHeight: 1.5, marginBottom: "0" }}>
                        Agradecemos sua compra. Você está sendo redirecionado para acompanhar seu pedido...
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'`;
content = content.replace(insert6Search, insert6Replace);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done!');
