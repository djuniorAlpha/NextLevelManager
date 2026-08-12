import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { createAdminCrudApi } from "@/lib/api/admin-crud";

interface WithId {
  id: string;
}

/**
 * Fábrica de hooks pra um recurso admin CRUD simples (list-admin/create/
 * update/remove). Criar e editar não têm toast de erro próprio — o
 * componente de formulário lê `mutation.error` e mostra inline, evitando
 * duplicar a mesma mensagem em dois lugares.
 */
export function createAdminCrudHooks<
  T extends WithId,
  CreateDto,
  UpdateDto = Partial<CreateDto>,
>(queryKey: string, api: ReturnType<typeof createAdminCrudApi<T, CreateDto, UpdateDto>>) {
  const key = [queryKey] as const;

  function useList() {
    return useQuery({ queryKey: key, queryFn: api.listAdmin });
  }

  function useCreate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (dto: CreateDto) => api.create(dto),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: key });
        toast.success("Criado com sucesso");
      },
    });
  }

  function useUpdate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, dto }: { id: string; dto: UpdateDto }) =>
        api.update(id, dto),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: key });
        toast.success("Atualizado com sucesso");
      },
    });
  }

  function useRemove() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => api.remove(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: key });
        toast.success("Excluído com sucesso");
      },
      onError: () => {
        toast.error("Não foi possível excluir. Tente novamente.");
      },
    });
  }

  return { useList, useCreate, useUpdate, useRemove };
}
