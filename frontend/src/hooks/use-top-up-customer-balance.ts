import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { topUpCustomerBalance } from "@/lib/api/customers";
import type { TopUpCustomerDto } from "@/types/customer";

export function useTopUpCustomerBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      customerId,
      dto,
    }: {
      customerId: string;
      dto: TopUpCustomerDto;
    }) => topUpCustomerBalance(customerId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Saldo adicionado com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível adicionar o saldo. Tente novamente.");
    },
  });
}
