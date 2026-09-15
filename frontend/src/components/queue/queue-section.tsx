"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDeleteDialog } from "@/components/billing/confirm-delete-dialog";
import { QueueColumn } from "@/components/queue/queue-column";
import { QueueFormDialog } from "@/components/queue/queue-form-dialog";
import { useQueues, useRemoveQueue } from "@/hooks/use-queues";
import type { Queue } from "@/types/queue";

type FormState = { mode: "create" } | { mode: "edit"; queue: Queue };

export function QueueSection() {
  const { data, isLoading, isError, refetch } = useQueues();
  const removeMutation = useRemoveQueue();

  const [formState, setFormState] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<Queue | null>(null);

  function handleConfirmDelete() {
    if (!deleting) return;
    removeMutation.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Cada fila é uma coluna; os itens dela aparecem como linhas dentro
          dela.
        </p>
        <Button size="sm" onClick={() => setFormState({ mode: "create" })}>
          <Plus data-icon="inline-start" />
          Nova fila
        </Button>
      </div>

      {isLoading && <Skeleton className="h-40 w-full" />}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar as filas.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!isLoading && !isError && data?.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nenhuma fila cadastrada ainda.
        </p>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {data.map((queue) => (
            <QueueColumn
              key={queue.id}
              queue={queue}
              onEdit={() => setFormState({ mode: "edit", queue })}
              onDelete={() => setDeleting(queue)}
            />
          ))}
        </div>
      )}

      <QueueFormDialog
        key={formState?.mode === "edit" ? formState.queue.id : "create"}
        open={formState !== null}
        onOpenChange={(open) => !open && setFormState(null)}
        queue={formState?.mode === "edit" ? formState.queue : null}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Excluir fila "${deleting?.name ?? ""}"?`}
        description="Todos os itens dessa fila também serão removidos. Essa ação não pode ser desfeita."
        onConfirm={handleConfirmDelete}
        isPending={removeMutation.isPending}
      />
    </div>
  );
}
