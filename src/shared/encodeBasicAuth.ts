export function encodeBasicAuth(value: string): string {
  if (typeof btoa === 'function') {
    return btoa(value);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf-8').toString('base64');
  }

  throw new Error('Base64 encoding is unavailable in this runtime.');
}
