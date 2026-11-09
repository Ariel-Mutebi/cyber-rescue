// 32 characters (no l, o, 0, 1), so `byte & 31` has no modulo bias
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

export function randomString(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => ALPHABET[b & 31]).join('')
}
