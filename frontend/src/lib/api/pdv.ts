import { apiFetch } from "@/lib/api/client";
import type { CreatePdvSaleDto, PdvSale } from "@/types/pdv";

export function createPdvSale(dto: CreatePdvSaleDto): Promise<PdvSale> {
  return apiFetch<PdvSale>("/pdv/sales", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function listPdvSales(): Promise<PdvSale[]> {
  return apiFetch<PdvSale[]>("/pdv/sales");
}
