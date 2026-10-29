/**
 * MessHishab - Standalone Daily WhatsApp Bazar Duty Cron Dispatcher
 * Can be executed daily at 07:00 AM via crontab, GitHub Actions, or Node server:
 * node scripts/cron-whatsapp-duty.mjs
 */

import https from 'https';

// Normalizes BD phone number to +880 format
function sanitizeBDPhoneNumber(phone = '') {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('00880')) digits = digits.slice(2);
  else if (digits.startsWith('880')) { /* already 880 */ }
  else if (digits.startsWith('01') && digits.length === 11) digits = `88${digits}`;
  else if (digits.startsWith('1') && digits.length === 10) digits = `880${digits}`;
  return digits;
}

// Sends WhatsApp via CallMeBot API (Free)
function sendCallMeBotWhatsApp(phone, message, apiKey) {
  return new Promise((resolve, reject) => {
    const cleanPhone = sanitizeBDPhoneNumber(phone);
    const target = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(target)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, response: data });
        } else {
          resolve({ success: false, error: data || `HTTP ${res.statusCode}` });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

console.log('----------------------------------------------------');
console.log('MessHishab - WhatsApp Duty Cron Runner');
console.log(`Execution Time: ${new Date().toISOString()}`);
console.log('----------------------------------------------------');

const args = process.argv.slice(2);
const phone = args[0] || process.env.TEST_PHONE;
const apiKey = args[1] || process.env.CALLMEBOT_API_KEY;

if (phone && apiKey) {
  const msg = `আসসালামু আলাইকুম!\nMessHishab থেকে জানানো হচ্ছে যে, আজ আপনার বাজার করার দায়িত্ব রয়েছে।\nতারিখ: ${new Date().toISOString().split('T')[0]}\n— MessHishab Automated Dispatcher`;
  console.log(`Sending WhatsApp message to ${phone}...`);
  sendCallMeBotWhatsApp(phone, msg, apiKey)
    .then((res) => console.log('Result:', res))
    .catch((err) => console.error('Error:', err));
} else {
  console.log('Usage: node scripts/cron-whatsapp-duty.mjs <phone> <callmebot_api_key>');
}
