"use client";

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMachines } from "@/hooks/use-machines";
import { useCreateQueueItem, useUpdateQueueItem } from "@/hooks/use-queue-items";
import { ApiError } from "@/lib/api/client";
import type { QueueItem } from "@/types/queue-item";

const NO_MACHINE = "none";

export function QueueItemFormDialog({
  open,
  onOpenChange,
  queueId,
  item,
  nextOrder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queueId: string;
  item?: QueueItem | null;
  nextOrder: number;
}) {
  const isEditing = Boolean(item);
  const { data: machines } = useMachines();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState(item?.username ?? "");
  const [order, setOrder] = useState(String(item ? item.order : nextOrder));
  const [machineId, setMachineId] = useState(item?.machineId ?? NO_MACHINE);

  const create = useCreateQueueItem();
  const update = useUpdateQueueItem();
  const mutation = isEditing ? update : create;

  function resetForm() {
    setUsername("");
    setOrder(String(nextOrder));
    setMachineId(NO_MACHINE);
  }

  // A lista de filas (com os itens aninhados) fica em cache sob a key
  // "queues" — as mutations de item só invalidam "queueItems", então
  // precisamos avisar o board pra refazer o fetch também.
  function invalidateQueues() {
    queryClient.invalidateQueries({ queryKey: ["queues"] });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dto = {
      username,
      order: Number(order),
      machineId: machineId === NO_MACHINE ? undefined : machineId,
    };

    if (isEditing && item) {
      update.mutate(
        { id: item.id, dto },
        {
          onSuccess: () => {
            invalidateQueues();
            onOpenChange(false);
          },
        },
      );
    } else {
      create.mutate(
        { ...dto, queueId },
        {
          onSuccess: () => {
            invalidateQueues();
            onOpenChange(false);
            resetForm();
          },
        },
      );
    }
  }

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.isError
        ? "Não foi possível salvar."
        : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar item" : "Novo item na fila"}
          </DialogTitle>
          <DialogDescription>
            Define a posição, quem está esperando e, opcionalmente, a estação
            reservada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qi-username">Usuário</Label>
            <Input
              id="qi-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qi-order">Posição</Label>
            <Input
              id="qi-order"
              type="number"
              min={1}
              step={1}
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qi-machine">Estação</Label>
            <Select value={machineId} onValueChange={setMachineId}>
              <SelectTrigger id="qi-machine">
                <SelectValue placeholder="Sem estação definida" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_MACHINE}>Sem estação definida</SelectItem>
                {(machines ?? []).map((machine) => (
                  <SelectItem key={machine.id} value={machine.id}>
                    Estação #{machine.machineNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {errorMessage && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
