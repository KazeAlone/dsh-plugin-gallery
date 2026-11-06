/** Resource labels are not credentials; getRandomValues also works on HTTP origins. */
export function createResourceIdentifier(type, cryptoApi = globalThis.crypto) {
  const bytes = new Uint8Array(12);
  if (typeof cryptoApi?.getRandomValues === 'function') cryptoApi.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return `${type}-${Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}`;
}
