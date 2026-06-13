export function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  if (globalThis.crypto?.getRandomValues) {
    const values = globalThis.crypto.getRandomValues(new Uint32Array(2));
    return `${Date.now().toString(36)}-${Array.from(values)
      .map((value) => value.toString(36))
      .join("")}`;
  }

  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}
