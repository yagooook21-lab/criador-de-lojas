import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useTracking } from '@/contexts/TrackingContext';
import { formatCurrency } from '@/utils/formatters';

const StoreCheckoutConfirmation = () => {
    const { cartItems, cartTotal } = useStore();
    const navigate = useNavigate();
    const { trackPurchase } = useTracking();
    const [cardInput, setCardInput] = useState<any>(null);
    const [installments, setInstallments] = useState<any>(null);

    useEffect(() => {
        const savedCard = localStorage.getItem('checkout_card_input');
        if (savedCard) {
            try { setCardInput(JSON.parse(savedCard)); } catch(e){}
        }
        const savedInst = localStorage.getItem('checkout_installment_selection');
        if (savedInst) {
            try { setInstallments(JSON.parse(savedInst)); } catch(e){}
        }

        // Tracking purchase using real provider
        if (cartItems.length > 0) {
            trackPurchase(installments?.total || cartTotal, "BRL", cartItems.map((i: any) => ({
                product_id: i.product.id,
                name: i.product.name,
                quantity: i.quantity,
                price: i.product.price
            })));
        }

        // Limpar os itens do carrinho após a finalização da compra
        localStorage.removeItem('store_cart');
    }, [cartItems, cartTotal, installments]);

    const formatPrice = (value: number) => {
        const str = (value || 0).toFixed(2);
        const [intPart, centPart] = str.split('.');
        return { integer: intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "."), cents: centPart };
    };

    const valFmt = installments ? formatPrice(installments.total) : { integer: '0', cents: '00' };

    return (
        <div style={{ backgroundColor: '#ededed', minHeight: '100vh', paddingBottom: '40px', fontFamily: '"Proxima Nova", -apple-system, Roboto, Arial, sans-serif' }}>
            {/* Header / Barra Verde do ML */}
            <div style={{ backgroundColor: '#00a650', height: '140px', width: '100%' }}></div>
            
            <div style={{ maxWidth: '600px', margin: '-90px auto 0', padding: '0 16px', position: 'relative', zIndex: 10 }}>
                {/* Status Box */}
                <div style={{ backgroundColor: '#fff', borderRadius: '6px', padding: '40px 24px', textAlign: 'center', boxShadow: '0 1px 2px 0 rgba(0,0,0,.15)' }}>
                    <div style={{ width: '70px', height: '70px', backgroundColor: '#00a650', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.5 12.5L10 18L19.5 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 style={{ fontSize: '26px', fontWeight: 600, color: 'rgba(0,0,0,.9)', margin: '0 0 10px' }}>Pronto! O seu pagamento foi aprovado</h1>
                    <p style={{ fontSize: '18px', color: 'rgba(0,0,0,.55)', margin: 0 }}>Você pagou {formatCurrency(installments?.total || cartTotal)}</p>
                </div>

                {/* Resumo Box */}
                <div style={{ backgroundColor: '#fff', borderRadius: '6px', padding: '24px', marginTop: '16px', boxShadow: '0 1px 2px 0 rgba(0,0,0,.15)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(0,0,0,.9)', margin: '0 0 20px' }}>Detalhes da transação</h2>
                    
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ width: '48px', height: '48px', border: '1px solid #e6e6e6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                                <line x1="2" y1="10" x2="22" y2="10"></line>
                            </svg>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: 'rgba(0,0,0,.9)' }}>Cartão de Crédito</p>
                            {cardInput && (
                                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(0,0,0,.55)' }}>
                                    {(cardInput.brand?.charAt(0).toUpperCase() + cardInput.brand?.slice(1))} finalizado em {cardInput.cardNumber.replace(/\D/g, '').slice(-4)}
                                </p>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                         <div style={{ width: '48px', height: '48px', border: '1px solid #e6e6e6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 600, color: '#666' }}>{installments?.installments || '1'}x</span>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: 'rgba(0,0,0,.9)' }}>
                                {installments?.installments || 1} parcela{(installments?.installments > 1 ? 's' : '')} de {formatCurrency(installments?.value || 0)}
                            </p>
                            {installments?.hasInterest && (
                                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(0,0,0,.55)' }}>com juros</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <button 
                        onClick={() => navigate('/store')}
                        style={{ backgroundColor: '#3483fa', borderRadius: '6px', color: '#fff', fontSize: '16px', fontWeight: 600, height: '48px', width: '100%', border: 'none', cursor: 'pointer', transition: 'background-color .2s ease-in' }}
                    >
                        Voltar para o início
                    </button>
                    <button 
                         onClick={() => navigate('/store')} 
                         style={{ backgroundColor: 'transparent', margin: '16px 0 0', color: '#3483fa', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
                    >
                        Ver minhas compras
                    </button>
                </div>
            </div>
            
            <style>
                {`
                button:hover { opacity: 0.9; }
                `}
            </style>
        </div>
    );
};

export default StoreCheckoutConfirmation;
