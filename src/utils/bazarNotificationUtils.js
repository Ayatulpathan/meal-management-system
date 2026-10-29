/**
 * Bazar Notification Utilities (WhatsApp & Alerts)
 * Helps construct messages and deep-links for notifying members of their market duty.
 */

import { formatDateDisplay } from './dateUtils.js';
import { formatCurrency } from './currencyUtils.js';

/**
 * Normalizes phone numbers to international standard with country code (defaults to BD +880)
 * @param {string} phone 
 * @returns {string} Digits only with country code, e.g. "88017XXXXXXXX"
 */
export const sanitizeBDPhoneNumber = (phone = '') => {
  if (!phone) return '';
  // Remove all non-numeric characters
  let digits = String(phone).replace(/\D/g, '');
  
  if (digits.startsWith('00880')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('880')) {
    // Already has BD country code
  } else if (digits.startsWith('01') && digits.length === 11) {
    digits = `88${digits}`;
  } else if (digits.startsWith('1') && digits.length === 10) {
    digits = `880${digits}`;
  }
  return digits;
};

/**
 * Generates an informative, polite dual-language (Bengali + English) WhatsApp message
 * @param {Object} params
 * @param {Object} params.schedule - Bazar schedule item
 * @param {string} [params.messName='MessHishab']
 * @returns {string}
 */
export const generateWhatsAppMessage = ({
  schedule,
  messName = 'MessHishab',
}) => {
  if (!schedule) return '';

  const memberName = schedule.memberName || 'সহযোদ্ধা';
  const dateFormatted = formatDateDisplay(schedule.date);
  const notesText = schedule.notes ? `📝 নোট/ফর্দ: ${schedule.notes}\n` : '';
  const budgetText = schedule.estimatedBudget > 0 ? `💵 আনুমানিক বাজেট: ${formatCurrency(schedule.estimatedBudget)}\n` : '';

  return (
`আসসালামু আলাইকুম ${memberName},
"${messName}" মেস থেকে জানানো হচ্ছে যে, আগামী ${dateFormatted} তারিখে আপনার বাজার করার শিডিউল (Bazar Duty) রয়েছে।

📅 তারিখ: ${dateFormatted}
👤 দায়িত্বপ্রাপ্ত: ${memberName}
${notesText}${budgetText}
অনুগ্রহ করে মেসের দায়িত্বপ্রাপ্তদের সাথে যোগাযোগ করে বাজারের ফর্দ ও প্রয়োজনীয় টাকা সংগ্রহ করে নিবেন।

ধন্যবাদ!
— ${messName} Management`
  ).trim();
};

/**
 * Generates the full WhatsApp Click-to-Chat deep link
 * @param {Object} params
 * @param {string} params.phone
 * @param {string} params.message
 * @returns {string}
 */
export const getWhatsAppUrl = ({ phone, message }) => {
  const cleanPhone = sanitizeBDPhoneNumber(phone);
  const encodedText = encodeURIComponent(message || '');
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  // If no phone number provided, open WhatsApp with text ready to choose contact
  return `https://wa.me/?text=${encodedText}`;
};

/**
 * Opens WhatsApp in a new browser tab/app
 * @param {Object} params
 * @param {string} params.phone
 * @param {string} params.message
 */
export const openWhatsAppChat = ({ phone, message }) => {
  const url = getWhatsAppUrl({ phone, message });
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Copies text to user clipboard safely
 * @param {string} text 
 * @returns {Promise<boolean>}
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('Clipboard copy error:', err);
    return false;
  }
};
