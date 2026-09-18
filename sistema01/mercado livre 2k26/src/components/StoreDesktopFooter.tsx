import { useEffect } from "react";
import { sanitizeStoreHTML } from "@/lib/mascaraSanitizer";
import type { MascaraSettings } from "@/hooks/useMascara";

const getFooterHTML = () => `

<div class="nav-footer-access nav-footer-access-collapsed">
  <h2><button id="nav-footer-access-switch" aria-expanded="false">Mais informações <i class="nav-icon-chevron-up"></i></button></h2>
  <div class="nav-footer-access-content">
    <div class="nav-bounds">
      <div class="nav-footer-access-col">
        <h3 class="nav-footer-access-title">Sobre o</h3>
        <ul>
          <li><a>Mercado Livre<span class="nav-footer-access-visually-hidden">, Sobre o</span></a></li>
          <li><a>Investor relations<span class="nav-footer-access-visually-hidden">, Sobre o</span></a></li>
          <li><a>Tendências<span class="nav-footer-access-visually-hidden">, Sobre o</span></a></li>
          <li><a>Sustentabilidade<span class="nav-footer-access-visually-hidden">, Sobre o</span></a></li>
          <li><a>Blog<span class="nav-footer-access-visually-hidden">, Sobre o</span></a></li>
        </ul>
      </div>
      <div class="nav-footer-access-col">
        <h3 class="nav-footer-access-title">Outros sites</h3>
        <ul>
          <li><a>Desenvolvedores<span class="nav-footer-access-visually-hidden">, Outros sites</span></a></li>
          <li><a>Mercado Pago<span class="nav-footer-access-visually-hidden">, Outros sites</span></a></li>
          <li><a>Envios<span class="nav-footer-access-visually-hidden">, Outros sites</span></a></li>
          <li><a>Mercado Ads<span class="nav-footer-access-visually-hidden">, Outros sites</span></a></li>
        </ul>
      </div>
      <div class="nav-footer-access-col">
        <h3 class="nav-footer-access-title">Contato</h3>
        <ul>
          <li><a>Comprar<span class="nav-footer-access-visually-hidden">, Contato</span></a></li>
          <li><a>Vender<span class="nav-footer-access-visually-hidden">, Contato</span></a></li>
          <li><a>Solução de problemas<span class="nav-footer-access-visually-hidden">, Contato</span></a></li>
          <li><a>Segurança<span class="nav-footer-access-visually-hidden">, Contato</span></a></li>
        </ul>
      </div>
      <div class="nav-footer-access-col">
        <h3 class="nav-footer-access-title">Redes sociais</h3>
        <ul>
          <li><a>X<span class="nav-footer-access-visually-hidden">, Redes sociais</span></a></li>
          <li><a>Facebook<span class="nav-footer-access-visually-hidden">, Redes sociais</span></a></li>
          <li><a>Instagram<span class="nav-footer-access-visually-hidden">, Redes sociais</span></a></li>
          <li><a>YouTube<span class="nav-footer-access-visually-hidden">, Redes sociais</span></a></li>
        </ul>
      </div>
      <div class="nav-footer-access-col">
        <h3 class="nav-footer-access-title">Minha conta</h3>
        <ul>
          <li><a>Entre<span class="nav-footer-access-visually-hidden">, Minha conta</span></a></li>
          <li><a>Vender<span class="nav-footer-access-visually-hidden">, Minha conta</span></a></li>
        </ul>
      </div>
      <div class="nav-footer-access-col">
        <h3 class="nav-footer-access-title">Assinaturas</h3>
        <ul>
          <li><a>Meli+<span class="nav-footer-access-visually-hidden">, Assinaturas</span></a></li>
          <li><a>Disney+<span class="nav-footer-access-visually-hidden">, Assinaturas</span></a></li>
          <li><a>HBO Max<span class="nav-footer-access-visually-hidden">, Assinaturas</span></a></li>
          <li><a>Netflix<span class="nav-footer-access-visually-hidden">, Assinaturas</span></a></li>
          <li><a>Apple TV+<span class="nav-footer-access-visually-hidden">, Assinaturas</span></a></li>
          <li><a>Paramount+<span class="nav-footer-access-visually-hidden">, Assinaturas</span></a></li>
          <li><a>Universal+<span class="nav-footer-access-visually-hidden">, Assinaturas</span></a></li>
          <li><a>Globoplay Premium<span class="nav-footer-access-visually-hidden">, Assinaturas</span></a></li>
        </ul>
      </div>
      <div class="nav-footer-access-col">
        <h3 class="nav-footer-access-title">Temporadas</h3>
        <ul>
          <li><a>Dia do consumidor<span class="nav-footer-access-visually-hidden">, Temporadas</span></a></li>
          <li><a>Dia das mães<span class="nav-footer-access-visually-hidden">, Temporadas</span></a></li>
          <li><a>Black Friday<span class="nav-footer-access-visually-hidden">, Temporadas</span></a></li>
          <li><a>Descontaco<span class="nav-footer-access-visually-hidden">, Temporadas</span></a></li>
        </ul>
      </div>
    </div>
  </div>
</div>
<footer role="contentinfo" class="nav-footer">
  <div class="nav-footer-user-info nav-bounds">
    <div class="nav-footer-info-wrapper">
      <div class="nav-footer-primaryinfo">
        <small class="nav-footer-copyright">Copyright &copy;&nbsp;1999-2026 Ebazar.com.br LTDA.</small>
        <nav class="nav-footer-navigation">
          <ul class="nav-footer-navigation__menu">
            <li class="nav-footer-navigation__item"><a class="nav-footer-navigation__link">Trabalhe conosco</a></li>
            <li class="nav-footer-navigation__item"><a class="nav-footer-navigation__link">Termos e condições</a></li>
            <li class="nav-footer-navigation__item"><a class="nav-footer-navigation__link">Promoções</a></li>
            <li class="nav-footer-navigation__item"><a class="nav-footer-navigation__link">Como cuidamos da sua privacidade</a></li>
            <li class="nav-footer-navigation__item"><a class="nav-footer-navigation__link">Acessibilidade</a></li>
            <li class="nav-footer-navigation__item"><a class="nav-footer-navigation__link">Contato</a></li>
            <li class="nav-footer-navigation__item"><a class="nav-footer-navigation__link">Informações sobre seguros</a></li>
            <li class="nav-footer-navigation__item"><a class="nav-footer-navigation__link">Programa de Afiliados</a></li>
          </ul>
        </nav>
      </div>
      <p class="nav-footer-secondaryinfo">CNPJ n.º 03.007.331/0001-41 / Av. das Nações Unidas, nº 3.003, Bonfim, Osasco/SP - CEP 06233-903 - empresa do grupo Mercado Livre.</p>
    </div>
  </div>
  <a class="nav-footer-hp">Mercado Livre</a>
</footer>

`;

interface StoreDesktopFooterProps {
  mascara?: MascaraSettings;
}

const StoreDesktopFooter = ({ mascara }: StoreDesktopFooterProps) => {
  useEffect(() => {
    // Wire up the expand/collapse toggle
    const btn = document.getElementById("nav-footer-access-switch");
    const access = document.querySelector(".nav-footer-access") as HTMLElement;
    if (!btn || !access) return;

    const handler = () => {
      if (access.classList.contains("nav-footer-access-collapsed")) {
        access.classList.remove("nav-footer-access-collapsed");
        access.classList.add("nav-footer-access-expanded");
        btn.setAttribute("aria-expanded", "true");
      } else {
        access.classList.remove("nav-footer-access-expanded");
        access.classList.add("nav-footer-access-collapsed");
        btn.setAttribute("aria-expanded", "false");
      }
    };

    btn.addEventListener("click", handler);
    return () => btn.removeEventListener("click", handler);
  }, []);

  const html = getFooterHTML();
  const finalHTML = mascara ? sanitizeStoreHTML(html, mascara) : html;

  return (
    <div className="hidden md:block" dangerouslySetInnerHTML={{ __html: finalHTML }} />
  );
};

export default StoreDesktopFooter;
