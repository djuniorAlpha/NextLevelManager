"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForceMachineAction } from "@/hooks/use-machine-actions";

export function MachineActions({
  machineId,
  machineNumber,
}: {
  machineId: string;
  machineNumber: number;
}) {
  const [shutdownDialogOpen, setShutdownDialogOpen] = useState(false);

  const lock = useForceMachineAction("lock");
  const unlock = useForceMachineAction("unlock");
  const shutdown = useForceMachineAction("shutdown");

  function confirmShutdown() {
    shutdown.mutate(machineId);
    setShutdownDialogOpen(false);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={lock.isPending}
        onClick={() => lock.mutate(machineId)}
      >
        {lock.isPending ? "Bloqueando..." : "Bloquear"}
      </Button>

      <Button
        size="sm"
        variant="outline"
        disabled={unlock.isPending}
        onClick={() => unlock.mutate(machineId)}
      >
        {unlock.isPending ? "Liberando..." : "Liberar"}
      </Button>

      <Button
        size="sm"
        variant="destructive"
        disabled={shutdown.isPending}
        onClick={() => setShutdownDialogOpen(true)}
      >
        {shutdown.isPending ? "Desligando..." : "Desligar"}
      </Button>

      <Dialog open={shutdownDialogOpen} onOpenChange={setShutdownDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desligar estação #{machineNumber}?</DialogTitle>
            <DialogDescription>
              Isso vai desligar a máquina completamente. A estação só volta a
              ficar disponível quando for ligada novamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShutdownDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmShutdown}>
              Desligar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
