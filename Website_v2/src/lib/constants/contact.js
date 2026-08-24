/**
 * Centralized contact information for TernakOS.
 * Fetched from environment variables for easy configuration.
 */

const rawNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '6281234567890';
// Ensure number starts with 62 and no '+' or '0' prefix
export const WA_NUMBER = rawNumber.replace(/\D/g, '').replace(/^0/, '62');
export const WA_URL = `https://wa.me/${WA_NUMBER}`;

export const CONTACT_EMAIL = 'support@ternakos.my.id';
export const BUSINESS_HOURS = 'Senin – Jumat, 08:00 – 17:00 WIB';
