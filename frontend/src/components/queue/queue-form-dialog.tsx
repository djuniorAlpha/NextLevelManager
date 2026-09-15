"use client";

import { useState, type FormEvent } from "react";
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
import { useCreateQueue, useUpdateQueue } from "@/hooks/use-queues";
import { ApiError } from "@/lib/api/client";
import type { Queue } from "@/types/queue";

export function QueueFormDialog({
  open,
  onOpenChange,
  queue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queue?: Queue | null;
}) {
  const isEditing = Boolean(queue);

  const [name, setName] = useState(queue?.name ?? "");

  const create = useCreateQueue();
  const update = useUpdateQueue();
  const mutation = isEditing ? update : create;

  function resetForm() {
    setName("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dto = { name };

    if (isEditing && queue) {
      update.mutate(
        { id: queue.id, dto },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      create.mutate(dto, {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      });
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
          <DialogTitle>{isEditing ? "Editar fila" : "Nova fila"}</DialogTitle>
          <DialogDescription>
            Uma fila agrupa pessoas aguardando vez em uma estação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="queue-name">Nome</Label>
            <Input
              id="queue-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
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
