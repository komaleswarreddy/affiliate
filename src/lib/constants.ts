// API URL - Used for all API requests
// Remove any trailing slashes for consistency
const rawApiUrl = typeof import.meta !== 'undefined' && import.meta.env 
  ? import.meta.env.VITE_API_URL 
  : process.env.VITE_API_URL || 'http://localhost:3000';

export const API_URL = rawApiUrl.endsWith('/') 
  ? rawApiUrl.slice(0, -1) 
  : rawApiUrl;

// Maximum number of affiliates allowed in the trial plan
export const TRIAL_MAX_AFFILIATES = 5;

// Maximum number of users allowed in the trial plan
export const TRIAL_MAX_USERS = 3;

// Maximum number of commission tiers allowed in the trial plan
export const TRIAL_MAX_COMMISSION_TIERS = 2;

// Maximum number of products allowed in the trial plan
export const TRIAL_MAX_PRODUCTS = 10;

// Trial period duration in days
export const TRIAL_PERIOD_DAYS = 14;

// Application name
export const APP_NAME = 'Affiliate Pro';

// Support email
export const SUPPORT_EMAIL = 'support@affiliatepro.com';

// Contact email
export const CONTACT_EMAIL = 'contact@affiliatepro.com';

// Social media links
export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/affiliatepro',
  facebook: 'https://facebook.com/affiliatepro',
  instagram: 'https://instagram.com/affiliatepro',
  linkedin: 'https://linkedin.com/company/affiliatepro'
}; 