
// Secure random generation utilities
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const generateSecureUsername = (): string => {
  const adjectives = ['Swift', 'Bold', 'Bright', 'Cool', 'Smart', 'Fresh', 'Sharp', 'Quick'];
  const nouns = ['Style', 'Look', 'Fashion', 'Trend', 'Vibe', 'Edge', 'Flow', 'Mode'];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  
  return `${randomAdjective}${randomNoun}${randomNumber}`;
};

export const generateSecureEmail = (): string => {
  const token = generateSecureToken(16);
  return `temp_${token}@temp.dripmax.app`;
};

export const generateSecurePassword = (): string => {
  // Generate a cryptographically secure password for temporary accounts
  const token = generateSecureToken(24);
  return token;
};
