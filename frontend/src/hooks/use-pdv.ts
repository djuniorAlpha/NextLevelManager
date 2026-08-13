import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createPdvSale, listPdvSales } from "@/lib/api/pdv";
import type { CreatePdvSaleDto } from "@/types/pdv";

export function usePdvSales() {
  return useQuery({ queryKey: ["pdv-sales"], queryFn: listPdvSales });
}

export function useCreatePdvSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePdvSaleDto) => createPdvSale(dto),
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ["pdv-sales"] });
      if (sale.customerId) {
        queryClient.invalidateQueries({ queryKey: ["customers"] });
      }
      toast.success("Venda registrada com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível registrar a venda. Tente novamente.");
    },
  });
}
