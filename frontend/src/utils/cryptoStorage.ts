// frontend/src/utils/cryptoStorage.ts
// AES-GCM encryption/decryption for BYOK API keys in localStorage.
// PROV-05: API key encrypted at rest keyed to userId + app salt.

const APP_SALT = 'contextdive_byok_v1';

/**
 * Derive an AES-GCM CryptoKey from userId + APP_SALT via SHA-256.
 */
async function deriveKey(userId: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(userId + APP_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', raw);
  return crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt apiKey with a user-specific AES-GCM key.
 * Returns base64-encoded IV (12 bytes) + ciphertext.
 */
export async function encryptApiKey(userId: string, apiKey: string): Promise<string> {
  const key = await deriveKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(apiKey);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  // Combine IV + ciphertext into single Uint8Array
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  // Return as base64 string
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a stored base64-encoded IV+ciphertext blob back to the original API key.
 * Throws if the key is wrong (wrong userId) or data is corrupted.
 */
export async function decryptApiKey(userId: string, stored: string): Promise<string> {
  const key = await deriveKey(userId);
  // Decode base64
  const combined = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

/**
 * Remove the encrypted API key from localStorage for this user.
 */
export function clearApiKey(userId: string): void {
  localStorage.removeItem(`byok_key_${userId}`);
}
