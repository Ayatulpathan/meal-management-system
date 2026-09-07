/**
 * Bangladeshi Taka Currency Utility
 */
export const CURRENCY_SYMBOL = '৳';

/**
 * Formats a numeric value into Bangladeshi Taka string format: ৳X,XXX or ৳X,XXX.XX
 * @param {number|string} amount
 * @param {boolean} includeDecimals
 * @returns {string}
 */
export const formatCurrency = (amount, includeDecimals = false) => {
  const num = Number(amount);
  if (isNaN(num)) return `${CURRENCY_SYMBOL}0`;

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = absNum.toLocaleString('en-IN', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  if (isNegative) {
    return `-${CURRENCY_SYMBOL}${formatted}`;
  }
  return `${CURRENCY_SYMBOL}${formatted}`;
};

/**
 * Formats balance with explicit +/- prefix for accounting readability
 * @param {number} balance
 * @returns {string}
 */
export const formatBalance = (balance) => {
  const num = Number(balance) || 0;
  if (num > 0) {
    return `+${formatCurrency(num, true)}`;
  }
  if (num < 0) {
    return `-${formatCurrency(Math.abs(num), true)}`;
  }
  return formatCurrency(0, true);
};
