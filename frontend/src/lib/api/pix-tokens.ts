import { apiFetch } from "@/lib/api/client";
import type { PixToken } from "@/types/pix-token";

export function listPixTokens(): Promise<PixToken[]> {
  return apiFetch<PixToken[]>("/pix-tokens/admin");
}
