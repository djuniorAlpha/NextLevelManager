import type { Session } from "@/types/auth";

const STORAGE_KEY = "nlm.session";

// undefined = ainda não lido do localStorage nesta sessão do módulo.
let cachedSession: Session | null | undefined;
const listeners = new Set<() => void>();

function readFromStorage(): Session | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

/**
 * Snapshot para useSyncExternalStore no lado cliente (só é chamado depois
 * da hidratação, então window já existe). Mantém uma referência em cache
 * para que chamadas repetidas devolvam o mesmo objeto quando nada mudou.
 */
export function getSessionSnapshot(): Session | null {
  if (cachedSession === undefined) {
    cachedSession = readFromStorage();
  }
  return cachedSession;
}

/** Snapshot usado durante SSR/hidratação, onde localStorage não existe. */
export function getServerSessionSnapshot(): Session | null {
  return null;
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSession(session: Session): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  cachedSession = session;
  notify();
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  cachedSession = null;
  notify();
}

/** Leitura pontual fora de React (ex.: montar o header de uma chamada fetch). */
export function getSession(): Session | null {
  return getSessionSnapshot();
}
