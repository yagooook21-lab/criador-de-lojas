/**
 * Translates raw HTML strings from PT-BR to ES (Spanish) or EN (English)
 * when the store is configured for a non-Brazilian country.
 * Runs BEFORE dangerouslySetInnerHTML so original PT text never renders.
 *
 * IMPORTANT: Longer / more-specific phrases MUST come before shorter ones
 * to avoid partial replacements that create mixed-language text.
 */

type Lang = "pt" | "es" | "en";

// ── PT-BR → ES ──────────────────────────────────────────────────────
const ptToEs: [RegExp, string][] = [
  // ─── Full phrases (longest first) ───────────────────────────────
  [/Mercado Livre Brasil - Onde comprar e vender de Tudo/gi, "Mercado Libre - Donde comprar y vender de Todo"],
  [/Mercado Livre Brasil/gi, "Mercado Libre"],
  [/Mercado Livre/gi, "Mercado Libre"],
  [/mercado livre/gi, "Mercado Libre"],

  // Header / Nav
  [/Buscar produtos, marcas e muito mais\.\.\./gi, "Buscar productos, marcas y más..."],
  [/Buscar produtos, marcas e muito mais/gi, "Buscar productos, marcas y más"],
  [/Informe seu\s*CEP/gi, "Ingresá tu código postal"],
  [/Crie a sua conta/gi, "Creá tu cuenta"],
  [/Creá tu cuenta/gi, "Creá tu cuenta"], // passthrough guard
  [/Pular para o conteúdo/gi, "Ir al contenido"],
  [/Comentar sobre\s*acessibilidade/gi, "Comentar sobre accesibilidad"],

  // Shopping info cards — full sentences FIRST
  [/Aproveite ofertas para comprar tudo que quiser\./gi, "Aprovechá ofertas para comprar todo lo que quieras."],
  [/Aprovechá ofertas para Comprar todo lo que quieras\./gi, "Aprovechá ofertas para comprar todo lo que quieras."],
  [/Confira os custos e prazos de entrega\./gi, "Consultá costos y plazos de entrega."],
  [/prazos de entrega/gi, "plazos de entrega"],
  [/Pague suas compras com rapidez e segurança\./gi, "Pagá tus compras con rapidez y seguridad."],
  [/Confira produtos com preços baixos\./gi, "Consultá productos con precios bajos."],
  [/Explore os produtos que são tendência\./gi, "Explorá productos que son tendencia."],
  [/em milhões de produtos a partir de/gi, "en millones de productos a partir de"],

  // Shopping info card titles & buttons
  [/Entre na sua conta/gi, "Ingresá a tu cuenta"],
  [/Ingresá na sua conta/gi, "Ingresá a tu cuenta"],
  [/Entrar na sua conta/gi, "Ingresar a tu cuenta"],
  [/Insira sua localização/gi, "Ingresá tu ubicación"],
  [/Meios de pagamento/gi, "Medios de pago"],
  [/Menos de R\$\s*\d+/gi, "Menos de $100"],
  [/Mostrar produtos/gi, "Ver productos"],
  [/Informar localização/gi, "Informar ubicación"],
  [/Mostrar meios/gi, "Ver medios"],
  [/Ir para Mais vendidos/gi, "Ir a Más vendidos"],

  // Body sections
  [/Escolha como pagar/gi, "Elegí cómo pagar"],
  [/Com Mercado Pago, você paga com cartão, boleto ou Pix\. Você também pode pagar em até 12x sem cartão com a Linha de Crédito\./gi,
    "Con Mercado Pago, pagá con tarjeta, transferencia o efectivo. También podés pagar en hasta 12 cuotas sin tarjeta con Créditos."],
  [/Com Mercado Pago, você paga com cartão, boleto ou Pix\./gi,
    "Con Mercado Pago, pagá con tarjeta, transferencia o efectivo."],
  [/Você também pode pagar em até 12x sem cartão com a Linha de Crédito\./gi,
    "También podés pagar en hasta 12 cuotas sin tarjeta con Créditos."],
  [/Como pagar com Mercado Pago/gi, "Cómo pagar con Mercado Pago"],

  [/Envío gratis acima de R\$\s*\d+\./gi, "Envío gratis en miles de productos."],
  [/Frete grátis acima de R\$\s*\d+\./gi, "Envío gratis en miles de productos."],
  [/Aproveite este benefício em milhões de produtos\./gi, "Aprovechá este beneficio en millones de productos."],

  [/Segurança, do início ao fim/gi, "Seguridad, de principio a fin"],
  [/Seguridad, do início ao fim/gi, "Seguridad, de principio a fin"],
  [/Você não gostou do que comprou\? Devolva! No Mercado Libre não há nada que você não possa fazer, porque você está sempre protegido\./gi,
    "¿No te gustó lo que compraste? ¡Devolvelo! En Mercado Libre no hay nada que no puedas hacer, porque siempre estás protegido."],
  [/Você não gostou do que comprou\?[^<]*/gi,
    "¿No te gustó lo que compraste? ¡Devolvelo! Siempre estás protegido."],
  [/Como te protegemos/gi, "Cómo te protegemos"],

  [/Termos mais procurados/gi, "Términos más buscados"],

  // Login page — full phrases
  [/INÍCIO DE SESSÃO/gi, "INICIO DE SESIÓN"],
  [/CRIAÇÃO DE CONTA/gi, "CREACIÓN DE CUENTA"],
  [/Digite seu e-mail ou telefone para iniciar sessão/gi, "Ingresá tu e-mail o teléfono para iniciar sesión"],
  [/Tenho um problema de segurança/gi, "Tengo un problema de seguridad"],
  [/Tenho um problema de Seguridad/gi, "Tengo un problema de seguridad"],
  [/Preciso de ajuda/gi, "Necesito ayuda"],
  [/E-mail ou\s*telefone/gi, "E-mail o teléfono"],
  [/Digite sua senha/gi, "Ingresá tu contraseña"],
  [/Escolher outro método/gi, "Elegir otro método"],
  [/Trocar conta/gi, "Cambiar cuenta"],
  [/Crie uma senha/gi, "Creá una contraseña"],
  [/Mostrar Senha/gi, "Mostrar Contraseña"],
  [/Nome completo/gi, "Nombre completo"],
  [/Protegido\s*por reCAPTCHA/gi, "Protegido por reCAPTCHA"],

  // Quick-access mobile labels
  [/Visto recentemente/gi, "Visto recientemente"],
  [/Também te interessa/gi, "También te interesa"],
  [/O que você quer/gi, "Lo que querés"],
  [/Inspirado no último visto/gi, "Inspirado en lo último visto"],
  [/Você também pode estar interessado/gi, "También te puede interesar"],
  [/Mais vendidos em/gi, "Más vendidos en"],
  [/Oferta do dia/gi, "Oferta del día"],
  [/Celulares/gi, "Celulares"],
  [/Veículos/gi, "Vehículos"],
  [/Computação/gi, "Computación"],
  [/Televisores/gi, "Televisores"],
  [/Imóveis/gi, "Inmuebles"],
  [/Afiliados/gi, "Afiliados"],
  [/Internacional/gi, "Internacional"],

  // Product page
  [/Adicionar ao carrinho/gi, "Agregar al carrito"],
  [/Comprar agora/gi, "Comprar ahora"],
  [/Cor:/gi, "Color:"],
  [/Tamanho:/gi, "Talle:"],
  [/Estoque disponível/gi, "Stock disponible"],
  [/(\d+) vendidos/gi, "$1 vendidos"],
  [/Devolução grátis/gi, "Devolución gratis"],
  [/Compra Garantida/gi, "Compra Garantizada"],
  [/Recondicionado/gi, "Reacondicionado"],
  [/em estoque/gi, "en stock"],
  [/Ver descrição completa/gi, "Ver descripción completa"],
  [/Descrição/gi, "Descripción"],
  [/Características/gi, "Características"],

  // Cart
  [/Carrinho de compras/gi, "Carrito de compras"],
  [/Seu carrinho está vazio/gi, "Tu carrito está vacío"],
  [/Continuar comprando/gi, "Seguir comprando"],
  [/Finalizar compra/gi, "Finalizar compra"],
  [/Resumo da compra/gi, "Resumen de compra"],
  [/Quantidade/gi, "Cantidad"],
  [/Excluir/gi, "Eliminar"],
  [/unidades/gi, "unidades"],
  [/unidade/gi, "unidad"],
  [/Subtotal/gi, "Subtotal"],
  [/Total/gi, "Total"],

  // Search
  [/resultados para/gi, "resultados para"],
  [/Nenhum resultado encontrado/gi, "No se encontraron resultados"],

  // Footer
  [/Mais informações/gi, "Más información"],
  [/Sobre o/gi, "Acerca de"],
  [/Outros sites/gi, "Otros sitios"],
  [/Redes sociais/gi, "Redes sociales"],
  [/Minha conta/gi, "Mi cuenta"],
  [/Desenvolvedores/gi, "Desarrolladores"],
  [/Solução de problemas/gi, "Solución de problemas"],
  [/Trabalhe conosco/gi, "Trabajá con nosotros"],
  [/Termos e condições/gi, "Términos y condiciones"],
  [/Como cuidamos da sua privacidade/gi, "Cómo cuidamos tu privacidad"],
  [/Informações sobre seguros/gi, "Información sobre seguros"],
  [/Programa de Afiliados/gi, "Programa de Afiliados"],
  [/Dia do consumidor/gi, "Día del consumidor"],
  [/Dia das mães/gi, "Día de la madre"],
  [/empresa do grupo Mercado Livre\./gi, "empresa del grupo Mercado Libre."],
  [/empresa do grupo Mercado Libre\./gi, "empresa del grupo Mercado Libre."],

  // Copyright
  [/Copyright\s*©?\s*&copy;?\s*&nbsp;?\s*1999-\d{4}\s*Ebazar\.com\.br LTDA\./gi, "Copyright © 1999-2026 MercadoLibre S.R.L."],
  [/&copy;&nbsp;1999-\d{4}\s*Ebazar\.com\.br LTDA\./gi, "&copy;&nbsp;1999-2026 MercadoLibre S.R.L."],

  // ─── Single words (LAST — after full phrases) ──────────────────
  [/Frete grátis/gi, "Envío gratis"],
  [/Categorias/gi, "Categorías"],
  [/Ofertas/gi, "Ofertas"],
  [/Cupons/gi, "Cupones"],
  [/Supermercado/gi, "Supermercado"],
  [/Mercado Play/gi, "Mercado Play"],
  [/Moda/gi, "Moda"],
  [/Vender/gi, "Vender"],
  [/Contato/gi, "Contacto"],
  [/Compras/gi, "Compras"],
  [/\bEntre\b/gi, "Ingresá"],
  [/Assinaturas/gi, "Suscripciones"],
  [/Temporadas/gi, "Temporadas"],
  [/Mercado Pago/gi, "Mercado Pago"],
  [/Envios/gi, "Envíos"],
  [/Mercado Ads/gi, "Mercado Ads"],
  [/Comprar/gi, "Comprar"],
  [/Segurança/gi, "Seguridad"],
  [/Promoções/gi, "Promociones"],
  [/Acessibilidade/gi, "Accesibilidad"],
  [/Descontaco/gi, "Descuentazo"],
  [/Black Friday/gi, "Black Friday"],
  [/\bNovo\b/gi, "Nuevo"],
  [/Usado/gi, "Usado"],
  [/Mais vendidos/gi, "Más vendidos"],
  [/Continuar/gi, "Continuar"],
  [/Criar\s*conta/gi, "Crear cuenta"],
  [/Privacidade/gi, "Privacidad"],
  [/Condições/gi, "Condiciones"],
  [/Senha/gi, "Contraseña"],
  [/Confirmar/gi, "Confirmar"],
  [/CPF/gi, "DNI/CUIT"],
  [/Telefone/gi, "Teléfono"],
  [/Ver mais/gi, "Ver más"],
  [/Ver todos/gi, "Ver todos"],
];

// ── PT-BR → EN ──────────────────────────────────────────────────────
const ptToEn: [RegExp, string][] = [
  [/Mercado Livre Brasil - Onde comprar e vender de Tudo/gi, "Mercado Libre - Buy and sell everything"],
  [/Mercado Livre Brasil/gi, "Mercado Libre"],
  [/Mercado Livre/gi, "Mercado Libre"],

  [/Buscar produtos, marcas e muito mais\.\.\./gi, "Search products, brands and more..."],
  [/Informe seu\s*CEP/gi, "Enter your ZIP"],

  [/Aproveite ofertas para comprar tudo que quiser\./gi, "Enjoy deals to buy everything you want."],
  [/Confira os custos e prazos de entrega\./gi, "Check shipping costs and delivery times."],
  [/Pague suas compras com rapidez e segurança\./gi, "Pay your purchases quickly and securely."],
  [/Confira produtos com preços baixos\./gi, "Check products with low prices."],
  [/Explore os produtos que são tendência\./gi, "Explore trending products."],
  [/Entre na sua conta/gi, "Sign in to your account"],
  [/Insira sua localização/gi, "Enter your location"],
  [/Meios de pagamento/gi, "Payment methods"],
  [/Mais vendidos/gi, "Best sellers"],
  [/Mostrar produtos/gi, "Show products"],
  [/Informar localização/gi, "Enter location"],
  [/Mostrar meios/gi, "Show methods"],

  [/Escolha como pagar/gi, "Choose how to pay"],
  [/Segurança, do início ao fim/gi, "Security, from start to finish"],
  [/Termos mais procurados/gi, "Most searched terms"],
  [/Como pagar com Mercado Pago/gi, "How to pay with Mercado Pago"],
  [/Como te protegemos/gi, "How we protect you"],

  [/Frete grátis/gi, "Free shipping"],
  [/Categorias/gi, "Categories"],
  [/Ofertas/gi, "Deals"],
  [/Cupons/gi, "Coupons"],
  [/Adicionar ao carrinho/gi, "Add to cart"],
  [/Comprar agora/gi, "Buy now"],
  [/Carrinho de compras/gi, "Shopping cart"],
  [/Finalizar compra/gi, "Checkout"],
  [/Continuar comprando/gi, "Continue shopping"],

  [/Digite seu e-mail ou telefone para iniciar sessão/gi, "Enter your email or phone to sign in"],
  [/Tenho um problema de segurança/gi, "I have a security issue"],
  [/Preciso de ajuda/gi, "I need help"],
  [/Continuar/gi, "Continue"],
  [/Criar\s*conta/gi, "Create account"],

  [/Copyright\s*©?\s*&copy;?\s*&nbsp;?\s*1999-\d{4}\s*Ebazar\.com\.br LTDA\./gi, "Copyright © 1999-2026 Ebazar.com.br LTDA."],
  [/Ver mais/gi, "See more"],
  [/Ver todos/gi, "See all"],
];

/**
 * Translates raw HTML from PT-BR to the target language.
 * Only runs replacements when language !== "pt".
 */
export function sanitizeHTMLForLanguage(html: string, language: Lang): string {
  if (!html || language === "pt") return html;

  const map = language === "es" ? ptToEs : ptToEn;
  let result = html;
  for (const [pattern, replacement] of map) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
