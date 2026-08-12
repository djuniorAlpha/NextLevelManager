import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { forceMachineAction } from "@/lib/api/machines";
import type { ForceAction } from "@/types/machine";

const ACTION_SENT_MESSAGE: Record<ForceAction, string> = {
  lock: "Comando de bloqueio enviado — aguardando confirmação da estação",
  unlock: "Comando de liberação enviado — aguardando confirmação da estação",
  shutdown: "Comando de desligamento enviado — aguardando confirmação da estação",
};

/**
 * Um hook por ação: cada botão (bloquear/liberar/desligar) chama esta
 * função com a ação fixa, ganhando seu próprio estado de loading
 * independente dos outros botões do mesmo card.
 */
export function useForceMachineAction(action: ForceAction) {
  return useMutation({
    mutationFn: (machineId: string) => forceMachineAction(machineId, action),
    onSuccess: () => {
      toast.success(ACTION_SENT_MESSAGE[action]);
    },
    onError: () => {
      toast.error("Não foi possível enviar o comando. Tente novamente.");
    },
  });
}
