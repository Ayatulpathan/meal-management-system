/**
 * Validation utilities for Meal Management System
 */

/**
 * Validates meal count (Only 0, 1, or 2 are allowed)
 * @param {number|string} val 
 * @returns {{ isValid: boolean, message?: string }}
 */
export const validateMealValue = (val) => {
  const num = Number(val);
  if (![0, 1, 2].includes(num)) {
    return { isValid: false, message: 'Meal count must be 0, 1, or 2 only.' };
  }
  return { isValid: true };
};

/**
 * Validates member form data
 * @param {{ name: string, email?: string, phone?: string, status?: string }} member 
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export const validateMember = (member) => {
  const errors = {};
  if (!member.name || !member.name.trim()) {
    errors.name = 'Member name is required.';
  } else if (member.name.trim().length < 2) {
    errors.name = 'Member name must be at least 2 characters.';
  }

  if (member.email && member.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(member.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
  }

  if (member.phone && member.phone.trim()) {
    // Bangladeshi phone standard or standard digits (min 7 digits)
    const phoneClean = member.phone.replace(/[\s-]/g, '');
    if (!/^\+?[0-9]{7,15}$/.test(phoneClean)) {
      errors.phone = 'Please provide a valid phone number (e.g. 017XXXXXXXX).';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates market cost form data
 * @param {{ date: string, amount: number|string, description?: string }} cost 
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export const validateMarketCost = (cost) => {
  const errors = {};
  if (!cost.date || !cost.date.trim()) {
    errors.date = 'Date is required.';
  }

  const amount = Number(cost.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.amount = 'Amount must be a number greater than 0.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates deposit form data
 * @param {{ memberId: string, amount: number|string, date: string, note?: string }} deposit 
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export const validateDeposit = (deposit) => {
  const errors = {};
  if (!deposit.memberId || !deposit.memberId.trim()) {
    errors.memberId = 'Please select a member.';
  }

  if (!deposit.date || !deposit.date.trim()) {
    errors.date = 'Date is required.';
  }

  const amount = Number(deposit.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.amount = 'Deposit amount must be greater than 0.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
