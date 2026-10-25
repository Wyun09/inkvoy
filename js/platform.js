// Only compatibility needed by the shared browser core. Desktop launch and
// filesystem operations are deliberately unavailable in the mobile bundle.
export function randomUUID() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export default {
  resolve: (...parts) => parts.join('/'), join: (...parts) => parts.join('/'),
  mkdir: unavailable, readdir: unavailable, readFile: unavailable, writeFile: unavailable,
};
function unavailable() { throw new Error('Desktop filesystem and browser launch are unavailable on Android.'); }
export const chromium = { launchPersistentContext: unavailable };

export class MobileBuffer extends Uint8Array {
  static from(value, encoding) {
    if (encoding !== 'base64') throw new Error('Only image base64 is supported.');
    const decoded = atob(value);
    return MobileBuffer.fromBytes(Uint8Array.from(decoded, char => char.charCodeAt(0)));
  }
  static fromBytes(bytes) { const result = new MobileBuffer(bytes.length); result.set(bytes); return result; }
  static isBuffer(value) { return value instanceof MobileBuffer; }
  toString(encoding) {
    if (encoding !== 'base64') throw new Error('Only image base64 is supported.');
    let raw = '';
    for (let offset = 0; offset < this.length; offset += 8192) raw += String.fromCharCode(...this.subarray(offset, offset + 8192));
    return btoa(raw);
  }
}
