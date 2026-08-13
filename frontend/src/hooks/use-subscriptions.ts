import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  cancelSubscription,
  createSubscription,
  listAllSubscriptions,
} from "@/lib/api/subscriptions";
import type { CreateSubscriptionDto } from "@/types/subscription";

export function useAllSubscriptions() {
  return useQuery({ queryKey: ["subscriptions"], queryFn: listAllSubscriptions });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      customerId,
      dto,
    }: {
      customerId: string;
      dto: CreateSubscriptionDto;
    }) => createSubscription(customerId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Assinatura criada — envie o link pro cliente");
    },
    onError: () => {
      toast.error("Não foi possível criar a assinatura. Tente novamente.");
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      customerId,
      subscriptionId,
    }: {
      customerId: string;
      subscriptionId: string;
    }) => cancelSubscription(customerId, subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Assinatura cancelada");
    },
    onError: () => {
      toast.error("Não foi possível cancelar a assinatura. Tente novamente.");
    },
  });
}
