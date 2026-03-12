// frontend/src/tests/cryptoStorage.test.ts
// Tests for AES-GCM encryption/decryption of API keys.
// PROV-05: encrypted localStorage persistence

import { describe, it, expect, beforeEach } from 'vitest';
import { encryptApiKey, decryptApiKey, clearApiKey } from '../utils/cryptoStorage';

beforeEach(() => {
  localStorage.clear();
});

describe('cryptoStorage', () => {
  it('round-trips encrypt then decrypt correctly', async () => {
    const userId = 'user-abc';
    const apiKey = 'sk-test-1234567890';
    const ciphertext = await encryptApiKey(userId, apiKey);
    expect(typeof ciphertext).toBe('string');
    const decrypted = await decryptApiKey(userId, ciphertext);
    expect(decrypted).toBe(apiKey);
  });

  it('different userId produces different ciphertext for same key', async () => {
    const apiKey = 'sk-test-1234567890';
    const c1 = await encryptApiKey('user-1', apiKey);
    const c2 = await encryptApiKey('user-2', apiKey);
    expect(c1).not.toBe(c2);
  });

  it('two encryptions of same key produce different ciphertext (random IV)', async () => {
    const userId = 'user-abc';
    const apiKey = 'sk-test-1234567890';
    const c1 = await encryptApiKey(userId, apiKey);
    const c2 = await encryptApiKey(userId, apiKey);
    // Random IV means different ciphertext each time
    expect(c1).not.toBe(c2);
    // But both decrypt correctly
    const d1 = await decryptApiKey(userId, c1);
    const d2 = await decryptApiKey(userId, c2);
    expect(d1).toBe(apiKey);
    expect(d2).toBe(apiKey);
  });

  it('clearApiKey removes the localStorage entry', async () => {
    const userId = 'user-abc';
    const apiKey = 'sk-test-1234567890';
    const ciphertext = await encryptApiKey(userId, apiKey);
    localStorage.setItem(`byok_key_${userId}`, ciphertext);
    expect(localStorage.getItem(`byok_key_${userId}`)).not.toBeNull();
    clearApiKey(userId);
    expect(localStorage.getItem(`byok_key_${userId}`)).toBeNull();
  });

  it('decryptApiKey with wrong userId throws or returns garbled data', async () => {
    const apiKey = 'sk-test-1234567890';
    const ciphertext = await encryptApiKey('user-1', apiKey);
    // Attempting to decrypt with different user should fail (wrong key)
    await expect(decryptApiKey('user-2', ciphertext)).rejects.toThrow();
  });
});
