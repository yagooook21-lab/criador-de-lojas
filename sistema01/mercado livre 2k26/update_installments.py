import re
import os

with open('src/pages/StoreCheckoutInstallments.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

top_target = """import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import installmentsMobileCssUrl from './installments-mobile.css?url';

const INSTALLMENTS_CSS_URLS = [
  "https://http2.mlstatic.com/frontend-assets/buyingflow-payment-web/index.4c4f88c6.css",
  "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/widgets/6.15.0/modeless-box.css",
  "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.15.0/mercadolibre/navigation-desktop.css",
];

const StoreCheckoutInstallments = () => {
  const navigate = useNavigate();
  const { cartTotal } = useStore();"""

top_replacement = """import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import installmentsMobileCssUrl from './installments-mobile.css?url';

const INSTALLMENTS_CSS_URLS = [
  "https://http2.mlstatic.com/frontend-assets/buyingflow-payment-web/index.4c4f88c6.css",
  "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/widgets/6.15.0/modeless-box.css",
  "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.15.0/mercadolibre/navigation-desktop.css",
];

const StoreCheckoutInstallments = () => {
  const navigate = useNavigate();
  const { cartTotal } = useStore();

  const [cardSettings, setCardSettings] = useState({ max_installments: 12, free_installments: 3, monthly_rate: 1.99 });
  const [installments, setInstallments] = useState<any[]>([]);
  const [selectedInstallment, setSelectedInstallment] = useState(1);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').eq('key', 'card_settings').maybeSingle();
      if (data?.value) {
        const v = data.value as any;
        setCardSettings({
          max_installments: v.max_installments ?? 12,
          free_installments: v.free_installments ?? 3,
          monthly_rate: v.monthly_rate ?? 1.99,
        });
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const calcInstallments = () => {
      const options = [];
      const total = cartTotal || 0;
      for (let i = 1; i <= cardSettings.max_installments; i++) {
        let val = total / i;
        let hasInterest = false;
        
        if (i > cardSettings.free_installments) {
          const r = cardSettings.monthly_rate / 100;
          if (r > 0) {
            val = (total * r) / (1 - Math.pow(1 + r, -i));
            hasInterest = true;
          }
        }
        
        options.push({
          installments: i,
          value: val,
          total: val * i,
          hasInterest
        });
      }
      setInstallments(options);
    };
    calcInstallments();
  }, [cartTotal, cardSettings]);

  useEffect(() => {
    const handleInstallmentChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.name === 'installment') {
        setSelectedInstallment(parseInt(target.value));
      }
    };
    document.addEventListener('change', handleInstallmentChange);
    return () => document.removeEventListener('change', handleInstallmentChange);
  }, []);"""

if top_target in code:
    code = code.replace(top_target, top_replacement)
else:
    print("Top target not found!")

bottom_target = """  useEffect(() => {
    const handleContinueClick = () => navigate('/store/checkout/confirmation');
    const buttons = document.querySelectorAll(
      '[data-testid="continue_button"], [data-testid="footer_container_continue_button"]'
    );
    buttons.forEach((btn) => btn.addEventListener('click', handleContinueClick));
    return () => {
      buttons.forEach((btn) => btn.removeEventListener('click', handleContinueClick));
    };
  });

  const formatPrice = (value: number) => {
    const formatted = value.toFixed(2);
    const [intPart, centPart] = formatted.split('.');
    const intFormatted = intPart.replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');
    return { integer: intFormatted, cents: centPart };
  };

  const total = formatPrice(cartTotal);"""

bottom_replacement = """  useEffect(() => {
    const handleContinueClick = () => navigate('/store/checkout/confirmation');
    const buttons = document.querySelectorAll(
      '[data-testid="continue_button"], [data-testid="footer_container_continue_button"]'
    );
    buttons.forEach((btn) => btn.addEventListener('click', handleContinueClick));
    return () => {
      buttons.forEach((btn) => btn.removeEventListener('click', handleContinueClick));
    };
  }, [navigate]);

  const formatPrice = (value: number) => {
    const formatted = (value || 0).toFixed(2);
    const [intPart, centPart] = formatted.split('.');
    const intFormatted = intPart.replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');
    return { integer: intFormatted, cents: centPart };
  };

  const selectedData = installments.find((o) => o.installments === selectedInstallment) || { value: cartTotal, total: cartTotal, installments: 1 };
  const totalFmt = formatPrice(selectedData.total);
  const valFmt = formatPrice(selectedData.value);
  const baseFmt = formatPrice(cartTotal);
  
  const installmentsHtml = installments.map((opt) => {
    const val = formatPrice(opt.value);
    const tot = formatPrice(opt.total);
    const isChecked = opt.installments === selectedInstallment ? 'checked' : '';
    const nameStr = `master_9769911943_${opt.installments}`;
    const inputId = `${nameStr}-se60n1avh`;

    return `
      <li class="andes-list__item bf-ui-core-list-item bf-ui-core-list-item__radio bf-ui-core-list-item--align-centered andes-list__item--size-medium" id="${nameStr}" data-testid="${nameStr}" data-js="bf-ui-core-list-item">
        <label for="${inputId}" class="bf-ui-core-list-item__container bf-ui-core-list-item__container--padding--top-spacing16 bf-ui-core-list-item__container--padding--bottom-spacing16 bf-ui-core-list-item__container--padding--left-spacing20 bf-ui-core-list-item__container--padding--right-spacing20 bf-ui-core-list-item__container--background-white">
          <div class="bf-ui-core-list-item__container-content">
            <div class="list-item__radio">
              <div class="andes-radio">
                <div class="andes-radio-element">
                  <input type="radio" class="andes-radio__input" id="${inputId}" name="installment" value="${opt.installments}" ${isChecked}>
                  <div class="andes-radio__background">
                    <div class="andes-radio__outer-circle"></div>
                    <div class="andes-radio__inner-circle"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="bf-ui-core-list-item__content bf-ui-core-list-item__content--flex bf-ui-core-list-item__content--flex-direction--row bf-ui-core-list-item__content--flex-align--center bf-ui-core-list-item__content--flex-text_align--left bf-ui-core-list-item__content--flex-justify--between bf-ui-core-list-item__content--flex-height--wrap_content bf-ui-core-list-item__content--flex-width--match_parent bf-ui-core-list-item__content--flex-wrap--no-wrap">
              <div class="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap">
                <div class="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--center bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap">
                  <span class="bf-ui-core-label bf-ui-core-label--margin--right-spacing8" role="presentation" aria-hidden="false">
                    <span class="andes-visually-hidden">${opt.installments} parcela${opt.installments > 1 ? 's' : ''} de ${val.integer} reais com ${val.cents} centavos</span>
                    <span class="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodyl" aria-hidden="true" role="presentation">
                      <span class="andes-typography andes-typography--type-body andes-typography--size-l andes-typography--color-primary andes-typography--weight-regular" role="presentation">${opt.installments}x </span>
                    </span>
                    <span class="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--primary" aria-hidden="true" role="presentation">
                      <span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:18px" role="img" aria-label="${val.integer} reais com ${val.cents} centavos" aria-roledescription="Valor">
                        <span class="andes-money-amount__currency-symbol" aria-hidden="true">R$</span>
                        <span class="andes-money-amount__fraction" aria-hidden="true">${val.integer}</span>
                        <span class="andes-visually-hidden" aria-hidden="true">,</span>
                        <span class="andes-money-amount__cents andes-money-amount__cents--superscript-18" style="font-size:10px;margin-top:3px" aria-hidden="true">${val.cents}</span>
                      </span>
                    </span>
                  </span>
                </div>
                ${!opt.hasInterest ? 
                `<div class="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--center bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap">
                   <span class="bf-ui-core-label" role="presentation"><span class="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--success bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodys" role="presentation"><span class="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-success andes-typography--weight-regular" role="presentation">Sem juros</span></span></span>
                 </div>` : 
                `<div class="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--center bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap">
                   <span class="bf-ui-core-label" role="presentation">
                     <span class="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-secondary andes-typography--weight-regular" style="color: rgba(0,0,0,0.55);">Total: R$ ${tot.integer},${tot.cents}</span>
                   </span>
                 </div>`}
              </div>
            </div>
          </div>
        </label>
      </li>`;
  }).join('');"""

if bottom_target in code:
    code = code.replace(bottom_target, bottom_replacement)
else:
    print("Bottom target not found!")

# Now the dynamically replacing the selected installment string and total in the innerHTML:

# Replace the inner html of <ul id="recommended-list...
list_regex = r'(<div role="radiogroup" aria-labelledby="recommended-list[^>]*>[^<]*<li class="andes-list__item[^<]*<label for="master_9769911943_1-se60n1avh".*?</li>[^<]*</div>)'

code = re.sub(list_regex, r'<div role="radiogroup" aria-labelledby="recommended-list/1cc8cb22-bdde-4775-908f-880f7b4c2f8d" id="recommended-list/1cc8cb22-bdde-4775-908f-880f7b4c2f8d-0">\n                        ${installmentsHtml}\n                      </div>', code, flags=re.DOTALL)

# Replace you will pay total (Você pagará)
# The format string contains: <span class="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-regular" role="presentation">1x </span>
voce_pay_1 = r'<span class="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-regular" role="presentation">1x </span>'
voce_pay_1_repl = r'<span class="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-regular" role="presentation">${selectedInstallment}x </span>'
code = code.replace(voce_pay_1, voce_pay_1_repl)

# The large chunk of total price under 'Você pagará'
# Total amounts in the original HTML were generated using `${total.integer}` and `${total.cents}`.
# I want to replace `${total.integer}` with `${valFmt.integer}` under selectedInstallment, and `${total.integer}` with `${baseFmt.integer}` under other basic "total" references.
# But there are multiple `${total.integer}` and `${total.cents}`
# Under "Produto", "Subtotal", it should be baseFmt.
# Under "Você pagará" (the installment value) it should be valFmt
# Under "Total" it should be totalFmt

# Let's cleanly replace them by context.
# 1. Produto:
code = code.replace('<span class="andes-visually-hidden">1 parcela de ${total.integer} reais com ${total.cents} centavos</span>', '<span class="andes-visually-hidden">${selectedInstallment} parcela${selectedInstallment > 1 ? \\'s\\' : \\'\\'} de ${valFmt.integer} reais com ${valFmt.cents} centavos</span>')

# Let's replace all `${total.integer}` to baseFmt.integer first, and then revert the ones we want to be valFmt or totalFmt.
code = code.replace('${total.integer}', '${baseFmt.integer}')
code = code.replace('${total.cents}', '${baseFmt.cents}')

# Now, we need to find "Você pagará".
# The span right after `1x ` was replaced with `${selectedInstallment}x `. Let's find:
# <span class="andes-money-amount__fraction" aria-hidden="true">${baseFmt.integer}</span><span class="andes-visually-hidden" aria-hidden="true">,</span><span class="andes-money-amount__cents andes-money-amount__cents--superscript-18" style="font-size:10px;margin-top:3px" aria-hidden="true">${baseFmt.cents}</span>
# Note that this exact block of integer and cents occurs TWICE with superscript-18:
# One is in "Você pagará" and one is in "Total".
parts = code.split('Você pagará')
if len(parts) > 1:
    voce_part = parts[1]
    # Replace the first `baseFmt` (which is the installment value) with `valFmt`
    voce_part = voce_part.replace('${baseFmt.integer}', '${valFmt.integer}', 1)
    voce_part = voce_part.replace('${baseFmt.cents}', '${valFmt.cents}', 1)
    
    # Replace the second `baseFmt` (which is the total value) with `totalFmt`
    # Wait, the next one is in "Total"
    voce_part = voce_part.replace('${baseFmt.integer}', '${totalFmt.integer}', 1)
    voce_part = voce_part.replace('${baseFmt.cents}', '${totalFmt.cents}', 1)
    
    code = parts[0] + 'Você pagará' + voce_part

with open('src/pages/StoreCheckoutInstallments.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Replacement complete.")
