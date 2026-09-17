/** Generates a locally-random identifier. Never derived from account/session data. */
export function generateId(): string {
  const g = globalThis as { crypto?: Crypto };
  if (g.crypto?.randomUUID) {
    return g.crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (older test runners).
  const bytes = new Uint8Array(16);
  if (g.crypto?.getRandomValues) {
    g.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
