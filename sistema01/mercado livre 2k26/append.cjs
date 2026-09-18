const fs = require('fs');
const filepath = 'src/pages/StoreCheckoutInstallments.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const missingText = `Você pagará</span></span></span>
                <div class="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--bottom bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--wrap_content bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--top-spacing4 bf-ui-core-container--margin--bottom-spacing4" aria-hidden="false" data-js="container" data-testid="purchase_amount_container_1_payment_type_container">
                  <span class="bf-ui-core-label" role="presentation" aria-hidden="false"><span class="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodys" aria-hidden="false" role="presentation"><span class="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-regular" role="presentation">\${selectedInstallment}x </span></span><span class="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--primary" aria-hidden="false" role="presentation"><span class="andes-money-amount andes-money-amount--cents-superscript andes-money-amount--weight-semibold" style="font-size:18px" role="img" aria-label="\${valFmt.integer} reais com \${valFmt.cents} centavos" aria-roledescription="Valor"><span class="andes-money-amount__currency-symbol" aria-hidden="true">R$</span><span class="andes-money-amount__fraction" aria-hidden="true">\${valFmt.integer}</span><span class="andes-visually-hidden" aria-hidden="true">,</span><span class="andes-money-amount__cents andes-money-amount__cents--superscript-18" style="font-size:10px;margin-top:3px" aria-hidden="true">\${valFmt.cents}</span></span></span></span>
                  <span class="bf-ui-core-label" role="presentation" aria-hidden="false"></span>
                  <span class="bf-ui-core-label" role="presentation" aria-hidden="false"><span class="andes-visually-hidden">Mastercard **** 7698</span><span class="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodys" aria-hidden="true" role="presentation"><span class="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-regular" role="presentation">Mastercard **** 7698</span></span></span>
                </div>
              </div>
              <hr class="bf-ui-core-separator bf-ui-core-separator--margin--top-spacing16 bf-ui-core-separator--margin--bottom-spacing16 bf-ui-core-separator--background-gray070 bf-ui-core-separator--height-spacing1" aria-hidden="true" data-testid="separator_4">
              <div class="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--top-spacing4" aria-hidden="false" data-js="container" data-testid="total_purchase_amount_container">
                <span class="bf-ui-core-label" role="presentation" aria-hidden="false"><span class="andes-visually-hidden">Total</span><span class="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--semibold bf-ui-core-rich-text__body--bodyl" aria-hidden="true" role="presentation"><span class="andes-typography andes-typography--type-body andes-typography--size-l andes-typography--color-primary andes-typography--weight-semibold" role="presentation">Total</span></span></span>
                <span class="bf-ui-core-label" role="presentation" aria-hidden="false"><span class="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--primary" aria-hidden="false" role="presentation"><span class="andes-money-amount andes-money-amount--cents-superscript andes-money-amount--weight-semibold" style="font-size:18px" role="img" aria-label="\${totalFmt.integer} reais com \${totalFmt.cents} centavos" aria-roledescription="Valor"><span class="andes-money-amount__currency-symbol" aria-hidden="true">R$</span><span class="andes-money-amount__fraction" aria-hidden="true">\${totalFmt.integer}</span><span class="andes-visually-hidden" aria-hidden="true">,</span><span class="andes-money-amount__cents andes-money-amount__cents--superscript-18" style="font-size:10px;margin-top:3px" aria-hidden="true">\${totalFmt.cents}</span></span></span></span>
              </div>
            </div>
            <div id="bf-ui-core-footer-placeholder" data-testid="bf-ui-core-footer-placeholder" class="bf-ui-core-footer-placeholder" style="height: 0px;"></div>
            <footer id="footer_container_id/1cc8cb22-bdde-4775-908f-880f7b4c2f8d" class="bf-ui-core-footer bf-ui-core-footer--flex bf-ui-core-footer--flex-direction--column bf-ui-core-footer--flex-align--none bf-ui-core-footer--flex-text_align--left bf-ui-core-footer--flex-justify--left bf-ui-core-footer--flex-height--wrap_content bf-ui-core-footer--flex-width--match_parent bf-ui-core-footer--flex-wrap--no-wrap bf-ui-core-footer--background-white bf-ui-core-footer--sticky-off bf-ui-core-footer--hidden" data-js="footer" data-testid="footer_container_id">
              <div class="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--main" aria-hidden="false" data-js="screen" data-testid="bf_main_container">
                <div class="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--right bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--top-spacing16 bf-ui-core-container--margin--bottom-spacing16 bf-ui-core-container--margin--right-spacing430" aria-hidden="false" data-js="container" data-testid="footer_container_buttons">
                  <button type="button" class="andes-button bf-ui-core-button bf-ui-core-button__simple bf-ui-core-button__hierarchy--loud bf-ui-core-button__size--large andes-button--large andes-button--loud" id="footer_container_continue_button/1cc8cb22-bdde-4775-908f-880f7b4c2f8d" aria-label="Continuar" data-testid="footer_container_continue_button">
                    <span class="andes-button__content"><span class="andes-button__text">Continuar</span></span>
                  </button>
                </div>
              </div>
            </footer>
          </div>
        </div>
      \` }} />

      <footer role="contentinfo" className="nav-footer">
        <div className="nav-footer-user-info nav-bounds">
          <div className="nav-footer-info-wrapper">
            <div className="nav-footer-primaryinfo">
              <small className="nav-footer-copyright">Copyright © 1999-2026 Ebazar.com.br LTDA.</small>
              <nav className="nav-footer-navigation">
                <ul className="nav-footer-navigation__menu">
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Trabalhe conosco</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Termos e condições</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Promoções</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Como cuidamos da sua privacidade</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Acessibilidade</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Contato</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Informações sobre seguros</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Programa de Afiliados</a></li>
                </ul>
              </nav>
            </div>
            <p className="nav-footer-secondaryinfo">CNPJ n.º 03.007.331/0001-41 / Av. das Nações Unidas, nº 3.003, Bonfim, Osasco/SP - CEP 06233-903 - empresa do grupo Mercado Livre.</p>
          </div>
        </div>
        <a className="nav-footer-hp">Mercado Livre</a>
      </footer>
    </>
  );
};

export default StoreCheckoutInstallments;
`;

content = content + missingText;
fs.writeFileSync(filepath, content, 'utf8');
console.log('Appended missing text.');
