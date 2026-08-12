import { clearSession, getSession } from "@/lib/auth-storage";

function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL não está configurada");
  }
  return url;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.message === "string") return body.message;
    if (Array.isArray(body?.message)) return body.message.join(", ");
  } catch {
    // corpo não é JSON ou está vazio, usa o texto padrão do status
  }
  return `Erro ${response.status}`;
}

/**
 * Wrapper de fetch para chamadas autenticadas ao backend.
 * Em 401, limpa a sessão — o AuthProvider (useSyncExternalStore) é notificado
 * na hora e o <AuthGuard> reage sozinho, redirecionando para /login.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const session = getSession();

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    clearSession();
    throw new ApiError(401, "Sessão expirada");
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function apiBaseUrl(): string {
  return getApiBaseUrl();
}
