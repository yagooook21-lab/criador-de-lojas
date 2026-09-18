/**
 * Utility functions for formatting values, specifically for the removal of the 
 * dynamic i18n system in favor of a hardcoded PT-BR/BRL system.
 */

/**
 * Formats a number as BRL currency (R$).
 */
export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val);
};

/**
 * Formats a number as BRL currency parts for custom UI rendering.
 */
export const formatCurrencyParts = (val: number) => {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).formatToParts(val);
  
  const symbol = formatted.find(p => p.type === 'currency')?.value || 'R$';
  const integer = formatted.filter(p => ['integer', 'group'].includes(p.type)).map(p => p.value).join('');
  const cents = formatted.find(p => p.type === 'fraction')?.value || '00';
  
  return { symbol, integer, cents };
};
