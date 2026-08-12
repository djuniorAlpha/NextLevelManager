import { apiFetch } from "@/lib/api/client";

interface WithId {
  id: string;
}

/**
 * Fábrica de cliente HTTP pra recursos admin com o shape
 * list-admin/create/update/remove — TimePackage e HourlyRate hoje têm
 * exatamente esse shape, só variando o path base e os tipos.
 */
export function createAdminCrudApi<
  T extends WithId,
  CreateDto,
  UpdateDto = Partial<CreateDto>,
>(basePath: string) {
  return {
    listAdmin: () => apiFetch<T[]>(`${basePath}/admin`),
    create: (dto: CreateDto) =>
      apiFetch<T>(basePath, { method: "POST", body: JSON.stringify(dto) }),
    update: (id: string, dto: UpdateDto) =>
      apiFetch<T>(`${basePath}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(dto),
      }),
    remove: (id: string) =>
      apiFetch<{ ok: true }>(`${basePath}/${id}`, { method: "DELETE" }),
  };
}
