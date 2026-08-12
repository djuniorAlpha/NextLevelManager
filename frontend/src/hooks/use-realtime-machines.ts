import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { MACHINES_QUERY_KEY } from "@/hooks/use-machines";
import type { Machine, MachineStatus } from "@/types/machine";

interface MachineStatusChangedPayload {
  machineId: string;
  status: MachineStatus;
}

/**
 * Mantém o mapa de estações vivo sem depender de reload manual.
 * Aplica cada `machine.status.changed` diretamente no cache (patch local,
 * sem refetch por evento) e re-sincroniza tudo via invalidateQueries em
 * cada (re)conexão — cobre o que possa ter sido perdido enquanto o socket
 * estava desconectado. refetchOnWindowFocus/refetchInterval em useMachines
 * são a rede de segurança adicional caso o socket fique mudo silenciosamente.
 */
export function useRealtimeMachines(token: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);

    function handleStatusChanged({
      machineId,
      status,
    }: MachineStatusChangedPayload) {
      queryClient.setQueryData<Machine[]>(MACHINES_QUERY_KEY, (old) =>
        old?.map((machine) =>
          machine.id === machineId
            ? { ...machine, status, online: true }
            : machine,
        ),
      );
    }

    function handleConnect() {
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEY });
    }

    socket.on("machine.status.changed", handleStatusChanged);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("machine.status.changed", handleStatusChanged);
      socket.off("connect", handleConnect);
    };
  }, [token, queryClient]);
}
