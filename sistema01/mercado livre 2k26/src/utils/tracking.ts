import { Country } from "@/contexts/I18nContext";

/**
 * Generates a fake tracking code based on the order number and country.
 * Format: [PREFIX][ORDER_NUMBER_PART][SUFFIX]
 * We use the last 9 digits of the timestamp or ID to keep it looking realistic.
 */
export const generateTrackingCode = (orderNumber: string, country: Country): string => {
  // Typical order number: ORD-1712767662551
  const numericPart = orderNumber.replace(/\D/g, '');
  const padded = numericPart.padStart(9, '0').slice(-9);
  
  switch (country) {
    case 'BR':
      return `BR${padded}LX`;
    case 'AR':
      return `AR${padded}AR`;
    case 'MX':
      return `MX${padded}MX`;
    case 'CL':
      return `CL${padded}CL`;
    case 'CO':
      return `CO${padded}CO`;
    case 'PE':
      return `PE${padded}PE`;
    default:
      return `TR${padded}US`;
  }
};

/**
 * Extracts the numeric part from a tracking code.
 */
export const getNumericPartFromCode = (code: string): string => {
  if (!code || code.length < 4) return "";
  return code.slice(2, -2);
};
