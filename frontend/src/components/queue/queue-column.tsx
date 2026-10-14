"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/billing/confirm-delete-dialog";
import { QueueItemFormDialog } from "@/components/queue/queue-item-form-dialog";
import { useRemoveQueueItem } from "@/hooks/use-queue-items";
import type { Queue } from "@/types/queue";
import type { QueueItem } from "@/types/queue-item";

type ItemFormState =
  | { mode: "create"; nextOrder: number }
  | { mode: "edit"; item: QueueItem };

export function QueueColumn({
  queue,
  onEdit,
  onDelete,
}: {
  queue: Queue;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const removeItem = useRemoveQueueItem();

  const [itemFormState, setItemFormState] = useState<ItemFormState | null>(
    null,
  );
  const [deletingItem, setDeletingItem] = useState<QueueItem | null>(null);

  function handleConfirmDeleteItem() {
    if (!deletingItem) return;
    removeItem.mutate(deletingItem.id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["queues"] });
        setDeletingItem(null);
      },
    });
  }

  const sortedItems = [...queue.items].sort((a, b) => a.order - b.order);

  // A posição vem sempre pré-preenchida com a próxima da fila, pra ninguém
  // furar fila sem querer — o campo continua editável se precisar reordenar.
  const nextOrder =
    queue.items.length === 0
      ? 1
      : Math.max(...queue.items.map((item) => item.order)) + 1;

  return (
    <Card className="w-[28rem] shrink-0">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="truncate">{queue.name}</CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil data-icon="inline-start" />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={onDelete}
          >
            <Trash2 data-icon="inline-start" />
            Excluir
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {sortedItems.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhum item nessa fila.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Estação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.order}</TableCell>
                  <TableCell>{item.username}</TableCell>
                  <TableCell>
                    {item.machine ? `#${item.machine.machineNumber}` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setItemFormState({ mode: "edit", item })
                        }
                      >
                        <Pencil data-icon="inline-start" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeletingItem(item)}
                      >
                        <Trash2 data-icon="inline-start" />
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setItemFormState({ mode: "create", nextOrder })}
        >
          <Plus data-icon="inline-start" />
          Adicionar item
        </Button>
      </CardContent>

      <QueueItemFormDialog
        key={
          itemFormState?.mode === "edit"
            ? itemFormState.item.id
            : `create-${itemFormState?.nextOrder ?? nextOrder}`
        }
        open={itemFormState !== null}
        onOpenChange={(open) => !open && setItemFormState(null)}
        queueId={queue.id}
        item={itemFormState?.mode === "edit" ? itemFormState.item : null}
        nextOrder={
          itemFormState?.mode === "create" ? itemFormState.nextOrder : nextOrder
        }
      />

      <ConfirmDeleteDialog
        open={deletingItem !== null}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title={`Remover "${deletingItem?.username ?? ""}" da fila?`}
        description="Essa ação não pode ser desfeita."
        onConfirm={handleConfirmDeleteItem}
        isPending={removeItem.isPending}
      />
    </Card>
  );
}
