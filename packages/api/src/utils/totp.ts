// ═══════════════════════════════════════════
// DineSmart OS — TOTP Utility (Minimal)
// ═══════════════════════════════════════════

import crypto from 'node:crypto';

/**
 * Minimal TOTP implementation to avoid external dependencies
 * This implements the core logic needed for 2FA.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(base32: string): Buffer {
  const normalized = base32.toUpperCase().replace(/=+$/, '');
  const bytes = new Uint8Array(Math.floor((normalized.length * 5) / 8));
  let bits = 0;
  let value = 0;
  let index = 0;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i]!;
    const charValue = BASE32_ALPHABET.indexOf(char);
    if (charValue === -1) continue;

    value = (value << 5) | charValue;
    bits += 5;

    if (bits >= 8) {
      bytes[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateToken(secret: string, options: { step?: number; window?: number } = {}): string {
  const step = options.step || 30;
  const counter = Math.floor(Date.now() / 1000 / step);
  const secretBuffer = base32Decode(secret);
  
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(buf);
  const hmacResult = hmac.digest();

  const offset = hmacResult[hmacResult.length - 1]! & 0xf;
  const code = (
    ((hmacResult[offset]! & 0x7f) << 24) |
    ((hmacResult[offset + 1]! & 0xff) << 16) |
    ((hmacResult[offset + 2]! & 0xff) << 8) |
    (hmacResult[offset + 3]! & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

export function verifyToken(token: string, secret: string): boolean {
  // Check current and previous window to handle slight clock drift
  const current = generateToken(secret);
  if (token === current) return true;
  
  // Check +/- 1 window (30s)
  const prev = generateToken(secret, { step: 30, window: -1 }); // This is a simplification
  // Actually, we should calculate counter +/- 1
  
  const step = 30;
  const nowCounter = Math.floor(Date.now() / 1000 / step);
  
  for (let i = -1; i <= 1; i++) {
    const counter = BigInt(nowCounter + i);
    const secretBuffer = base32Decode(secret);
    const buf = Buffer.alloc(8);
    buf.writeBigInt64BE(counter, 0);
    
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(buf);
    const hmacResult = hmac.digest();
    
    const offset = hmacResult[hmacResult.length - 1]! & 0xf;
    const code = (
      ((hmacResult[offset]! & 0x7f) << 24) |
      ((hmacResult[offset + 1]! & 0xff) << 16) |
      ((hmacResult[offset + 2]! & 0xff) << 8) |
      (hmacResult[offset + 3]! & 0xff)
    ) % 1000000;
    
    if (token === code.toString().padStart(6, '0')) return true;
  }

  return false;
}

export function generateSecret(): string {
  const bytes = crypto.randomBytes(20);
  let base32 = '';
  let value = 0;
  let bits = 0;

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i]!;
    bits += 8;

    while (bits >= 5) {
      base32 += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    base32 += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return base32;
}

export function keyuri(user: string, issuer: string, secret: string): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(user)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}

export const authenticator = {
  generateSecret,
  keyuri,
  verify: (options: { token: string; secret: string }) => verifyToken(options.token, options.secret),
};
