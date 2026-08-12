import { ApiError, apiBaseUrl } from "@/lib/api/client";
import type { LoginResponse } from "@/types/auth";

/**
 * Usa fetch puro (não apiFetch) de propósito: esta chamada nunca tem token
 * ainda, e um 401 (senha errada) não deve disparar o fluxo de
 * limpar-sessão-e-redirecionar-para-/login do apiFetch — já estamos lá.
 */
export async function loginAdmin(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(`${apiBaseUrl()}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    let message = "Usuário ou senha inválidos";
    try {
      const body = await response.json();
      if (typeof body?.message === "string") message = body.message;
    } catch {
      // ignora corpo não-JSON
    }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<LoginResponse>;
}
