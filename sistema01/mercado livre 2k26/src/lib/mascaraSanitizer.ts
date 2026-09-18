import type { MascaraSettings } from "@/hooks/useMascara";

interface CountryLegalData {
  brandName: string;
  companyName: string;
  legalLine: string;
}

function getCountryLegalData(): CountryLegalData {
  const countryCode =
    typeof window !== "undefined" ? localStorage.getItem("app_country") || "BR" : "BR";

  if (countryCode === "BR") {
    return {
      brandName: "Mercado Livre",
      companyName: "Ebazar.com.br LTDA.",
      legalLine:
        "CNPJ n.º 03.007.331/0001-41 / Av. das Nações Unidas, nº 3.003, Bonfim, Osasco/SP - CEP 06233-903 - empresa do grupo Mercado Livre.",
    };
  }

  return {
    brandName: "Mercado Libre",
    companyName: "MercadoLibre S.R.L.",
    legalLine:
      "NIT n.º 30-99999999-7 / Av. Siempre Viva 742 - empresa del grupo Mercado Libre.",
  };
}

/**
 * Sanitizes HTML strings to remove all "Mercado Livre" references
 * when mascara (white-label) is active. This runs BEFORE the HTML
 * is rendered via dangerouslySetInnerHTML, so the original brand
 * never appears in the page source.
 */
export function sanitizeHTMLForMascara(html: string, mascara: MascaraSettings): string {
  if (!html) return html;

  const countryLegal = getCountryLegalData();

  if (!mascara.active) {
    let result = html;

    // País padrão quando máscara está inativa
    if (countryLegal.brandName !== "Mercado Livre") {
      result = result.replace(
        /Mercado Livre Brasil - Onde comprar e vender de Tudo/gi,
        `${countryLegal.brandName} - Onde comprar e vender de Tudo`
      );
      result = result.replace(/Mercado Livre Brasil/gi, countryLegal.brandName);
      result = result.replace(/Mercado Livre/gi, countryLegal.brandName);
      result = result.replace(/mercado livre/gi, countryLegal.brandName);
    }

    result = result.replace(/CNPJ n\.º[^<]*/gi, countryLegal.legalLine);
    result = result.replace(/Ebazar\.com\.br LTDA\./gi, countryLegal.companyName);
    result = result.replace(
      /Copyright\s*©?\s*&copy;?\s*&nbsp;?\s*1999-\d{4}\s*Ebazar\.com\.br LTDA\./gi,
      `Copyright © 1999-2026 ${countryLegal.companyName}`
    );
    result = result.replace(
      /&copy;&nbsp;1999-\d{4}\s*Ebazar\.com\.br LTDA\./gi,
      `&copy;&nbsp;1999-2026 ${countryLegal.companyName}`
    );

    return result;
  }

  const brandName = mascara.name?.trim() || "";
  const replacementBrand =
    brandName || (countryLegal.brandName === "Mercado Livre" ? "Loja Online" : "Tienda Online");
  
  let result = html;

  // Replace brand references in visible text content
  // Case-insensitive replacements for all variations
  const patterns = [
    /Mercado Livre Brasil - Onde comprar e vender de Tudo/gi,
    /Mercado Livre Brasil/gi,
    /mercado livre/gi,
    /Mercado Livre/gi,
    /Mercado Libre/gi,
    /mercado libre/gi,
    /Mercado Play/gi,
    /Meli\+/gi,
    /Ebazar\.com\.br LTDA\./gi,
    /empresa do grupo Mercado Livre\./gi,
    /empresa del grupo Mercado Libre\./gi,
  ];

  // First pass: replace full brand phrases with mascara name
  result = result.replace(patterns[0], replacementBrand);
  result = result.replace(patterns[1], replacementBrand);
  result = result.replace(patterns[2], replacementBrand);
  result = result.replace(patterns[3], replacementBrand);
  result = result.replace(patterns[4], replacementBrand);
  result = result.replace(patterns[5], replacementBrand);
  
  // Replace "Mercado Play" and "Meli+" with empty or brand name
  result = result.replace(patterns[6], brandName || "Streaming");
  result = result.replace(patterns[7], "Assinatura");
  
  // Replace company legal name
  result = result.replace(patterns[8], brandName ? `${brandName}.` : replacementBrand);
  result = result.replace(patterns[9], brandName ? `empresa ${brandName}.` : "");
  result = result.replace(patterns[10], brandName ? `empresa ${brandName}.` : "");

  // Replace CNPJ/address line always when máscara is active
  const legalParts: string[] = [];
  if (mascara.cnpj) legalParts.push(`CNPJ n.º ${mascara.cnpj}`);
  if (mascara.address) legalParts.push(mascara.address);
  const legalReplacement = legalParts.length ? legalParts.join(" / ") : brandName ? `empresa ${brandName}.` : "";
  result = result.replace(/CNPJ n\.º[^<]*/gi, legalReplacement);
  result = result.replace(/NIT n\.º[^<]*/gi, legalReplacement);

  // Replace copyright company name
  result = result.replace(
    /Copyright\s*©?\s*&copy;?\s*&nbsp;?\s*1999-\d{4}\s*Ebazar\.com\.br LTDA\./gi,
    `Copyright © 1999-2026 ${replacementBrand}`
  );
  result = result.replace(
    /&copy;&nbsp;1999-\d{4}\s*Ebazar\.com\.br LTDA\./gi,
    `&copy;&nbsp;1999-2026 ${replacementBrand}`
  );

  // Final pass: ensure "Mercado Livre/Mercado Libre" words are not left in body text
  result = result.replace(/Mercado\s+Livre/gi, replacementBrand);
  result = result.replace(/Mercado\s+Libre/gi, replacementBrand);

  return result;
}

/**
 * Combined sanitizer: applies mascara.
 * Use this as the single entry point for all raw HTML sanitization.
 */
export function sanitizeStoreHTML(html: string, mascara: MascaraSettings): string {
  if (!html) return html;
  return sanitizeHTMLForMascara(html, mascara);
}
