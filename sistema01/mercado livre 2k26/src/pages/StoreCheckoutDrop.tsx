import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { ArrowLeft } from "lucide-react";
import { isValidCpf, formatCpf } from "@/utils/cpfValidator";

const StoreCheckoutDrop = () => {
  const navigate = useNavigate();
  const { cartItems } = useStore();

  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    zip: "",
    name: "",
    document: "",
    phone: "",
    streetName: "",
    streetNumber: "",
    apartment: "",
    additionalInfo: "",
    addressType: "residential",
  });

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/store/cart", { replace: true });
      return;
    }
    const saved = localStorage.getItem("checkout_address");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch { }
    }

    const storeName = localStorage.getItem("store_user_name");
    const storePhone = localStorage.getItem("store_user_phone");
    const storeDoc = localStorage.getItem("store_user_document") || localStorage.getItem("store_user_cpf");
    if (storeName) setFormData(prev => ({ ...prev, name: prev.name || storeName }));
    if (storePhone) setFormData(prev => ({ ...prev, phone: prev.phone || storePhone }));
    if (storeDoc) setFormData(prev => ({ ...prev, document: prev.document || storeDoc }));
  }, [cartItems, navigate]);
  useEffect(() => {
    const checkLoginRequired = async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "store_options")
        .maybeSingle();

      const opts = data?.value as any;
      const requireLogin = opts?.request_login === true;

      if (requireLogin) {
        const isLoggedIn = localStorage.getItem("store_logged_in") === "true";
        if (!isLoggedIn) {
          sessionStorage.setItem("store_login_referrer", "/store/checkout/drop");
          navigate("/store/login", { replace: true });
        }
      }
    };
    checkLoginRequired();
  }, [navigate]);


  useEffect(() => {
    const fetchAddress = async () => {
      const cleanedZip = formData.zip.replace(/[^a-zA-Z0-9]/g, "");
      if (!cleanedZip) return;

      if (cleanedZip.length === 8 && /^[0-9]+$/.test(cleanedZip)) {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cleanedZip}/json/`);
          const data = await res.json();
          if (!data.erro) {
            setFormData(prev => ({
              ...prev,
              streetName: data.logradouro ? data.logradouro : prev.streetName,
              address: data.logradouro ? data.logradouro : prev.address,
              city: data.localidade ? data.localidade : prev.city,
              state: data.uf ? data.uf : prev.state,
              additionalInfo: data.bairro ? (prev.additionalInfo ? (prev.additionalInfo.includes(data.bairro) ? prev.additionalInfo : prev.additionalInfo + ` - Bairro: ${data.bairro}`) : `Bairro: ${data.bairro}`) : prev.additionalInfo
            }));
          }
        } catch (e) {
          console.error("ViaCEP error:", e);
        }
      } else if (cleanedZip.length === 4 && /^[0-9]+$/.test(cleanedZip)) {
        try {
          const res = await fetch(`https://api.zippopotam.us/ar/${cleanedZip}`);
          if (res.ok) {
            const data = await res.json();
            if (data.places && data.places.length > 0) {
              const place = data.places[0];
              setFormData(prev => ({
                ...prev,
                city: place["place name"] ? place["place name"] : prev.city,
                state: place["state abbreviation"] || place["state"] || prev.state,
              }));
            }
          }
        } catch (e) {
          console.error("Zippopotam.us error:", e);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      if (formData.zip) fetchAddress();
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [formData.zip]);

  const isLoggedIn = !!localStorage.getItem("store_user_id") || localStorage.getItem("store_access") === "authorized";
  const documentLabel = "CPF";
  const [cpfError, setCpfError] = useState<string>("");

  const updateField = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCpf = (formData.document || "").replace(/\D/g, "");
    if (!isValidCpf(rawCpf)) {
      setCpfError("CPF inválido. Verifique e tente novamente.");
      const el = document.getElementById("document") as HTMLInputElement | null;
      el?.focus();
      return;
    }
    setCpfError("");
    const toSave = { ...formData, document: rawCpf };
    localStorage.setItem("checkout_address", JSON.stringify(toSave));
    navigate("/store/checkout/shipping");
  };

  return (
    <>
      {/* Desktop CSS */}
      <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.21.0/mercadolibre/navigation-desktop.css" media="screen and (min-width: 768px)" />
      <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/addresses-single-line/theme-ml.e018782f.css" media="screen and (min-width: 768px)" />
      <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/widgets/7.21.0/modeless-box.css" media="screen and (min-width: 768px)" />
      <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/addresses-single-line/address-index.6cfc248a.css" media="screen and (min-width: 768px)" />

      {/* Mobile CSS */}
      <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.21.0/mercadolibre/navigation-mobile.css" media="screen and (max-width: 767px)" />
      <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/addresses-single-line/theme-ml.e018782f.css" media="screen and (max-width: 767px)" />
      <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/widgets/7.21.0/modeless-box.css" media="screen and (max-width: 767px)" />
      <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/addresses-single-line/address-index.mobile.7f78064a.css" media="screen and (max-width: 767px)" />

      <style>{`
        @font-face {
            font-family: 'Proxima Nova';
            font-weight: 300;
            font-display: swap;
            font-style: normal;
            src: url(https://http2.mlstatic.com/ui/webfonts/v3.0.0/proxima-nova/proximanova-light.woff2) format("woff2"), url(https://http2.mlstatic.com/ui/webfonts/v3.0.0/proxima-nova/proximanova-light.woff) format("woff"), url(https://http2.mlstatic.com/ui/webfonts/v3.0.0/proxima-nova/proximanova-light.ttf) format("truetype")
        }

        @font-face {
            font-family: 'Proxima Nova';
            font-weight: 400;
            font-display: swap;
            font-style: normal;
            src: url(https://http2.mlstatic.com/ui/webfonts/v3.0.0/proxima-nova/proximanova-regular.woff2) format("woff2"), url(https://http2.mlstatic.com/ui/webfonts/v3.0.0/proxima-nova/proximanova-regular.woff) format("woff"), url(https://http2.mlstatic.com/ui/webfonts/v3.0.0/proxima-nova/proximanova-regular.ttf) format("truetype")
        }

        @font-face {
            font-family: 'Proxima Nova';
            font-weight: 600;
            font-display: swap;
            font-style: normal;
            src: url(https://http2.mlstatic.com/ui/webfonts/v3.0.0/proxima-nova/proximanova-semibold.woff2) format("woff2"), url(https://http2.mlstatic.com/ui/webfonts/v3.0.0/proxima-nova/proximanova-semibold.woff) format("woff"), url(https://http2.mlstatic.com/ui/webfonts/v3.0.0/proxima-nova/proximanova-semibold.ttf) format("truetype")
        }

        * {
            font-family: 'Proxima Nova', sans-serif !important;
        }

        .andes-ui-radio__input:checked + .andes-ui-radio__background .andes-ui-radio__outer-circle {
            border-color: #3483fa !important;
        }
        
         .andes-ui-radio__input:checked+.andes-ui-radio__background .andes-ui-radio__outer-circle {
        background-color: #3483fa !important;

    }

        .andes-ui-checkbox__input:checked + .andes-ui-checkbox__icon {
            background-color: #3483fa !important;
            border-color: #3483fa !important;
        }

        @media screen and (max-width: 767px) {
          .andes-ui-textfield__slotted-content {
            display: none !important;
          }
          main#root-app {
            display: revert !important;
          }
          div#_R_5lae_ {
            border: none !important;
            padding: 0 !important;
          }
          .andes-ui-textfield__control-container {
            border-radius: 6px !important;
          }
          a.md\\:hidden {
            display: none !important;
          }
          span.andes-ui-typography.andes-ui-button__text.andes-ui-button__content.andes-ui-typography--type-body.andes-ui-typography--size-medium.andes-ui-typography--color-primary.andes-ui-typography--weight-emphasis.andes-ui-typography-body-medium-emphasis {
            color: #fff !important;
          }
          button#_r_5_ {
            border-radius: 6px !important;
            background: rgba(52, 131, 250, 1.000) !important;
          }
          a.nav-header-cp-anchor.nav-menu-cp.nav-menu-cp-logged {
            display: none !important;
          }
          div#nav-header-menu-mobile-user-info {
            display: none !important;
          }
        }

        @media screen and (min-width: 768px) {
          div#_R_5lae_ {
            border: none !important;
            border-radius: 6px;
          }
          a.md\\:hidden {
            display: none !important;
          }
          .andes-ui-textfield__control-container {
            border-radius: 6px !important;
          }
          span.nav-header-usermenu-wrapper {
            display: none !important;
          }
          button#_r_5_ {
            border-radius: 6px;
            background: rgba(52, 131, 250, 1.000) !important;
          }
          span.andes-ui-typography.andes-ui-button__text.andes-ui-button__content.andes-ui-typography--type-body.andes-ui-typography--size-medium.andes-ui-typography--color-primary.andes-ui-typography--weight-emphasis.andes-ui-typography-body-medium-emphasis {
            color: #fff !important;
            margin-right: 10px;
          }
        }
        span.andes-ui-typography.andes-ui-button__text.andes-ui-button__content.andes-ui-typography--type-body.andes-ui-typography--size-medium.andes-ui-typography--color-primary.andes-ui-typography--weight-emphasis.andes-ui-typography-body-medium-emphasis {
          font-size: unset !important;
        }
      `}</style>

      <main role="main" id="root-app" data-navigation="true">
        <div className="layout">
          <div className="layout__container">
            <Link to="/store/cart" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#3483fa", textDecoration: "none", margin: "24px 20px 0 20px", fontSize: "14px" }} className="md:hidden">
              <ArrowLeft size={16} /> Voltar ao carrinho
            </Link>
            <h1 className="andes-ui-typography layout__container__title andes-ui-typography--type-heading andes-ui-typography--size-large andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-heading-large-default">
              {isLoggedIn ? "Editar endereço" : "Adicionar endereço"}
            </h1>
            <div className="andes-ui-card layout__container__card andes-ui-card--default andes-ui-card--padding-large" id="_R_5lae_" data-andes-card="true" data-andes-card-appearance="default">
              <form className="andes-ui-form form" id="address-form" data-andes-form="true" onSubmit={handleSubmit}>
                <input type="hidden" name="_csrf" value="zkwpzRCU-cdTxK53N5EeKpQsS7zJvLXqr9tI" />
                <div className="row form__row--split">
                  <div className="andes-ui-textfield zipcode__field" data-andes-textfield="true">
                    <div className="andes-ui-textfield__label-container andes-ui-label__label-container">
                      <label htmlFor="zipcode" data-andes-textfield-label="true"><span className="andes-ui-typography andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default">Informe o seu CEP</span></label>
                    </div>
                    <div className="andes-ui-textfield__control-container">
                      <div className="andes-ui-textfield__control">
                        <input className="andes-ui-typography andes-ui-textfield__field andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default" width="150" id="zipcode" maxLength={120} placeholder="Informe o seu CEP" aria-label="Informe o seu CEP" data-andes-textfield-input="true" data-andes-textfield-input-type="input" name="zipCode" value={formData.zip || ""} onChange={e => updateField("zip", e.target.value)} required />
                        <div className="andes-ui-textfield__slotted-content">
                          <div className="zipcode__right">
                            <button type="button" className="andes-ui-button zipcode__button andes-ui-button--medium andes-ui-button--mute" id="_r_1_" data-andes-button="true" data-andes-button-hierarchy="mute" data-andes-button-size="medium">
                              <div className="andes-ui-button__content" data-andes-button-content="true"><span className="andes-ui-typography andes-ui-button__text andes-ui-button__content andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-emphasis andes-ui-typography-body-medium-emphasis" data-andes-button-text="true">Não sei meu CEP</span></div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="sanitization-container">
                    <div className="form__row--split">
                      <div className="andes-ui-textfield row--child" data-andes-textfield="true">
                        <div className="andes-ui-textfield__label-container andes-ui-label__label-container">
                          <label htmlFor="streetName" data-andes-textfield-label="true"><span className="andes-ui-typography andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default">Rua / Avenida</span></label>
                        </div>
                        <div className="andes-ui-textfield__control-container">
                          <div className="andes-ui-textfield__control">
                            <input className="andes-ui-typography andes-ui-textfield__field andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default" data-testid="streetName" width="150" id="streetName" maxLength={120} placeholder="Ex: Av. das Nações Unidas" aria-label="Rua / Avenida" data-andes-textfield-input="true" data-andes-textfield-input-type="input" name="streetName" value={formData.streetName || formData.address || ""} onChange={e => { updateField("streetName", e.target.value); updateField("address", e.target.value); }} required />
                          </div>
                        </div>
                      </div>
                      <div className="andes-ui-textfield row--child street__number" data-andes-textfield="true">
                        <div className="andes-ui-textfield__label-container andes-ui-label__label-container">
                          <label htmlFor="streetNumber" data-andes-textfield-label="true"><span className="andes-ui-typography andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default">Número</span></label>
                        </div>
                        <div className="andes-ui-textfield__control-container">
                          <div className="andes-ui-textfield__control">
                            <input className="andes-ui-typography andes-ui-textfield__field andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default" data-testid="streetNumber" width="150" id="streetNumber" maxLength={120} placeholder="Ex: 123" aria-label="Número" data-andes-textfield-input="true" data-andes-textfield-input-type="input" name="streetNumber" value={formData.streetNumber || ""} onChange={e => updateField("streetNumber", e.target.value)} required />
                            <div className="andes-ui-textfield__slotted-content">
                              <label className="andes-ui-checkbox street__checkbox andes-ui-checkbox--with-label andes-ui-checkbox--label-left" data-andes-checkbox="true"><span className="andes-ui-checkbox__checkbox" data-andes-checkbox-container="true"><input className="andes-ui-checkbox__input" id="_r_2_" aria-labelledby="_r_2_-srLabel" data-andes-checkbox-input="true" type="checkbox" onChange={e => updateField("streetNumber", e.target.checked ? "S/N" : "")} /><span className="andes-ui-checkbox__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" color="currentColor" data-andes-icon-size="xtiny" data-andes-icon-current-color="true" style={{ height: "var(--andes-size-height-icons-xtiny, 16px)", width: "var(--andes-size-width-icons-xtiny, 16px)" }}><path d="M17.2882 7.29875C17.6787 6.90822 18.3127 6.90824 18.7032 7.29875C19.0934 7.68923 19.0935 8.32236 18.7032 8.71282L10.7149 16.7011C10.5274 16.8886 10.2731 16.9941 10.0079 16.9941C9.74276 16.9941 9.48841 16.8886 9.30089 16.7011L5.29698 12.6972C4.9065 12.3067 4.90658 11.6737 5.29698 11.2831C5.6875 10.8926 6.32052 10.8926 6.71104 11.2831L10.0069 14.579L17.2882 7.29875Z" fill="currentColor"></path></svg></span></span><span className="andes-ui-typography andes-ui-checkbox__label andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default" aria-hidden="true" data-andes-checkbox-label="true">Sem número</span><span className="andes-ui-visually-hidden" id="_r_2_-srLabel">Sem número</span></label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="sanitization-container">
                    <div className="form__row--split">
                      <div className="andes-ui-textfield row--child" data-andes-textfield="true">
                        <div className="andes-ui-textfield__label-container andes-ui-label__label-container">
                          <label htmlFor="cityName" data-andes-textfield-label="true"><span className="andes-ui-typography andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default">Cidade</span></label>
                        </div>
                        <div className="andes-ui-textfield__control-container">
                          <div className="andes-ui-textfield__control">
                            <input className="andes-ui-typography andes-ui-textfield__field andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default" width="150" id="cityName" maxLength={120} placeholder="Ex: São Paulo" aria-label="Cidade" data-andes-textfield-input="true" data-andes-textfield-input-type="input" name="cityName" value={formData.city || ""} onChange={e => updateField("city", e.target.value)} required />
                          </div>
                        </div>
                      </div>
                      <div className="andes-ui-textfield row--child street__number" data-andes-textfield="true" style={{ maxWidth: "130px" }}>
                        <div className="andes-ui-textfield__label-container andes-ui-label__label-container">
                          <label htmlFor="stateName" data-andes-textfield-label="true"><span className="andes-ui-typography andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default">Estado</span></label>
                        </div>
                        <div className="andes-ui-textfield__control-container">
                          <div className="andes-ui-textfield__control">
                            <input className="andes-ui-typography andes-ui-textfield__field andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default" width="150" id="stateName" maxLength={2} placeholder="UF" aria-label="Estado" data-andes-textfield-input="true" data-andes-textfield-input-type="input" name="stateName" value={formData.state || ""} onChange={e => updateField("state", e.target.value.toUpperCase())} required />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row form__row--split">
                  <div className="sanitization-container">
                    <div className="andes-ui-textfield row--child" data-andes-textfield="true">
                      <div className="andes-ui-textfield__label-container andes-ui-label__label-container">
                        <label htmlFor="department" data-andes-textfield-label="true"><span className="andes-ui-typography andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default">Complemento (opcional)</span></label>
                      </div>
                      <div className="andes-ui-textfield__control-container">
                        <div className="andes-ui-textfield__control">
                          <input className="andes-ui-typography andes-ui-textfield__field andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default" id="department" maxLength={20} placeholder="Ex: Apto 12" aria-label="Complemento (opcional)" data-andes-textfield-input="true" data-andes-textfield-input-type="input" name="apartment" value={formData.apartment || ""} onChange={e => updateField("apartment", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="sanitization-container">
                    <div className="andes-ui-textfield row--child andes-ui-textfield--countdown" data-andes-textfield="true">
                      <div className="andes-ui-textfield__label-container andes-ui-label__label-container">
                        <label htmlFor="indications" data-andes-textfield-label="true"><span className="andes-ui-typography andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default">Informações adicionais (opcional)</span></label>
                      </div>
                      <div className="andes-ui-textfield__control-container">
                        <div className="andes-ui-textfield__control">
                          <input className="andes-ui-typography andes-ui-textfield__field andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default" width="150" id="indications" maxLength={128} placeholder="Ex: Casa azul, fundos" aria-describedby="indications-count" data-andes-textfield-input="true" data-andes-textfield-input-type="input" name="additionalInfo" value={formData.additionalInfo || ""} onChange={e => updateField("additionalInfo", e.target.value)} />
                        </div>
                      </div>
                      <div className="andes-ui-textfield__bottom" data-andes-textfield-bottom-info="true">
                        <span className="andes-ui-typography andes-ui-textfield__countdown andes-ui-typography--type-body andes-ui-typography--size-small andes-ui-typography--color-secondary andes-ui-typography--weight-default andes-ui-typography-body-small-default" id="indications-countdown-progress" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={128} aria-label="Máximo de 128 caracteres" data-andes-textfield-countdown="true">{(formData.additionalInfo || "").length} / 128</span>
                        <span className="andes-ui-visually-hidden" id="indications-count" aria-live="polite" aria-atomic="true"></span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="sanitization-container">
                    <div className="form--address-type__title">
                      <h2 className="andes-ui-typography andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default">É trabalho ou casa?</h2>
                    </div>
                    <div role="radiogroup" className="address-type__group" aria-label="É trabalho ou casa?">
                      <div className="andes-ui-radio andes-ui-radio--with-label" data-andes-radio-button="true">
                        <div className="andes-ui-radio-element" data-andes-radio-button-tick="true">
                          <input className="andes-ui-radio__input" id="_r_3_" type="radio" name="addressType" value="residential" checked={formData.addressType === "residential"} onChange={() => updateField("addressType", "residential")} />
                          <div className="andes-ui-radio__background">
                            <div className="andes-ui-radio__outer-circle"></div>
                            <div className="andes-ui-radio__inner-circle"></div>
                          </div>
                        </div>
                        <label className="andes-ui-typography andes-ui-radio__label andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default" htmlFor="_r_3_" data-andes-radio-button-label="true"><i className="icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" color="var(--andes-color-icon-primary, #252537)" data-andes-icon-size="xsmall" data-andes-icon-current-color="true" style={{ height: "var(--andes-icon-internal-size-height, var(--andes-size-height-icons-xsmall, 24px))", width: "var(--andes-icon-internal-size-width, var(--andes-size-width-icons-xsmall, 24px))" }}><path fillRule="evenodd" clipRule="evenodd" d="M9.73633 2.41702C11.0006 1.18083 13.0218 1.18309 14.2842 2.42093L20.4014 8.41995C20.942 8.94842 21.2499 9.66984 21.25 10.4248V20.0117C21.25 20.9782 20.4665 21.7617 19.5 21.7617H14.6562C14.2421 21.7617 13.9063 21.4259 13.9062 21.0117V16.1074C13.9061 15.055 13.0528 14.2022 12 14.2022C10.9472 14.2022 10.0939 15.055 10.0938 16.1074V21.0117C10.0937 21.4259 9.75794 21.7617 9.34375 21.7617H4.5C3.53352 21.7617 2.75003 20.9782 2.75 20.0117V10.4248C2.75014 9.66984 3.05801 8.94842 3.59863 8.41995C5.64502 6.41956 7.69009 4.41808 9.73633 2.41702ZM13.2334 3.49124C12.5537 2.82502 11.4656 2.82406 10.7852 3.48929C8.73927 5.49001 6.69306 7.49262 4.64648 9.49319C4.39074 9.7434 4.25014 10.0794 4.25 10.4248V20.0117C4.25003 20.1498 4.36195 20.2617 4.5 20.2617H8.59375V16.1074C8.59393 14.2262 10.119 12.7022 12 12.7022C13.881 12.7022 15.4061 14.2262 15.4062 16.1074V20.2617H19.5C19.6381 20.2617 19.75 20.1498 19.75 20.0117V10.4248C19.7499 10.0794 19.6093 9.7434 19.3535 9.49319L19.3525 9.49222L13.2334 3.49124Z" fill="currentColor"></path></svg></i><span className="radio__label-text">Casa</span></label>
                      </div>
                      <div className="andes-ui-radio andes-ui-radio--with-label" data-andes-radio-button="true">
                        <div className="andes-ui-radio-element" data-andes-radio-button-tick="true">
                          <input className="andes-ui-radio__input" id="_r_4_" type="radio" name="addressType" value="business" checked={formData.addressType === "business"} onChange={() => updateField("addressType", "business")} />
                          <div className="andes-ui-radio__background">
                            <div className="andes-ui-radio__outer-circle"></div>
                            <div className="andes-ui-radio__inner-circle"></div>
                          </div>
                        </div>
                        <label className="andes-ui-typography andes-ui-radio__label andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default" htmlFor="_r_4_" data-andes-radio-button-label="true"><i className="icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.4688 6.9H14.9688V6.4V4.98333C14.9688 4.52962 14.589 4.2 14.1719 4.2H8.82812C8.41096 4.2 8.03125 4.52962 8.03125 4.98333V6.4V6.9H8.53125H14.4688ZM6.75 6.9H7.25V6.4V4.98333C7.25 4.18684 7.93533 3.5 8.82812 3.5H14.1719C15.0647 3.5 15.75 4.18684 15.75 4.98333V6.4V6.9H16.25H18.625C19.6811 6.9 20.5 7.71434 20.5 8.66667V11.5667H13.875H9.125H2.5V8.66667C2.5 7.71434 3.31893 6.9 4.375 6.9H6.75ZM14.375 14.3333V13.7H20.5V17.7333C20.5 18.6857 19.6811 19.5 18.625 19.5H4.375C3.31893 19.5 2.5 18.6857 2.5 17.7333V13.7H8.625V14.3333C8.625 15.2581 9.40178 15.9667 10.3125 15.9667H12.6875C13.5982 15.9667 14.375 15.2581 14.375 14.3333Z" stroke="black"></path></svg></i><span className="radio__label-text">Trabalho</span></label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="contact">
                    <div className="sanitization-container">
                      <div className="contact__title">
                        <h2 className="andes-ui-typography contact__title-heading andes-ui-typography--type-body andes-ui-typography--size-large andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-large-default">Dados de contato</h2>
                        <div className="contact__title__delivery-message">
                          <p className="andes-ui-typography andes-ui-typography--type-body andes-ui-typography--size-small andes-ui-typography--color-secondary andes-ui-typography--weight-default andes-ui-typography-body-small-default">Usaremos esses dados apenas para a entrega</p>
                        </div>
                      </div>
                    </div>
                    <div className="andes-ui-textfield row--child" data-andes-textfield="true">
                      <div className="andes-ui-textfield__label-container andes-ui-label__label-container">
                        <label htmlFor="name" data-andes-textfield-label="true"><span className="andes-ui-typography andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default">Nome completo</span></label>
                      </div>
                      <div className="andes-ui-textfield__control-container">
                        <div className="andes-ui-textfield__control">
                          <input className="andes-ui-typography andes-ui-textfield__field andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default" width="150" aria-required="true" id="name" maxLength={120} aria-label="Nome completo" data-andes-textfield-input="true" data-andes-textfield-input-type="input" name="contact" value={formData.name || ""} onChange={e => updateField("name", e.target.value)} required />
                        </div>
                      </div>
                    </div>
                    <div className="andes-ui-textfield row--child" data-andes-textfield="true">
                      <div className="andes-ui-textfield__label-container andes-ui-label__label-container">
                        <label htmlFor="document" data-andes-textfield-label="true"><span className="andes-ui-typography andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default">{documentLabel}</span></label>
                      </div>
                      <div className="andes-ui-textfield__control-container">
                        <div className="andes-ui-textfield__control">
                          <input
                            className="andes-ui-typography andes-ui-textfield__field andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default"
                            width="150"
                            aria-required="true"
                            id="document"
                            maxLength={14}
                            inputMode="numeric"
                            aria-invalid={!!cpfError}
                            aria-describedby={cpfError ? "document-error" : undefined}
                            aria-label={documentLabel}
                            data-andes-textfield-input="true"
                            data-andes-textfield-input-type="input"
                            name="document"
                            value={formatCpf(formData.document || "")}
                            onChange={e => {
                              const cleanValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                              updateField("document", cleanValue);
                              if (cpfError) setCpfError("");
                            }}
                            onBlur={e => {
                              const raw = e.target.value.replace(/\D/g, "");
                              if (raw.length > 0 && !isValidCpf(raw)) {
                                setCpfError("CPF inválido. Verifique e tente novamente.");
                              }
                            }}
                            style={cpfError ? { borderColor: "#f23d4f" } : undefined}
                            required
                          />
                          {cpfError && (
                            <div id="document-error" style={{ color: "#f23d4f", fontSize: "12px", marginTop: "4px" }}>
                              {cpfError}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="sanitization-container">
                    <div className="andes-ui-textfield row--child" data-andes-textfield="true">
                      <div className="andes-ui-textfield__label-container andes-ui-label__label-container">
                        <label htmlFor="phone" data-andes-textfield-label="true"><span className="andes-ui-typography andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default">Telefone de contato</span></label>
                      </div>
                      <div className="andes-ui-textfield__control-container">
                        <div className="andes-ui-textfield__control">
                          <input className="andes-ui-typography andes-ui-textfield__field andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-default andes-ui-typography-body-medium-default" width="150" id="phone" maxLength={120} data-andes-textfield-input="true" data-andes-textfield-input-type="input" name="phone" value={formData.phone || ""} onChange={e => updateField("phone", e.target.value)} required />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row form--button">
                  <button type="submit" className="andes-ui-button form--button__submit andes-ui-button--large andes-ui-button--loud" id="_r_5_" aria-label="Salvar" data-andes-button="true" data-andes-button-hierarchy="loud" data-andes-button-size="large" style={{ color: "#fff" }}>
                    <div className="andes-ui-button__content" data-andes-button-content="true"><span className="andes-ui-typography andes-ui-button__text andes-ui-button__content andes-ui-typography--type-body andes-ui-typography--size-medium andes-ui-typography--color-primary andes-ui-typography--weight-emphasis andes-ui-typography-body-medium-emphasis" data-andes-button-text="true" style={{ color: "#fff", margin: 0 }}>Salvar</span></div>
                  </button>
                </div>
              </form>
            </div>
            <section id="layout-form-footer" className="layout__container__footer"></section>
            <div id="form-buttons-outside" className="layout__container__form-buttons-outside"></div>
          </div>
        </div>
      </main>
    </>
  );
};

export default StoreCheckoutDrop;
