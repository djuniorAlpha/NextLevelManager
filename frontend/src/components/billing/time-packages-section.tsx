"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/billing/confirm-delete-dialog";
import { TimePackageFormDialog } from "@/components/billing/time-package-form-dialog";
import {
  useRemoveTimePackage,
  useTimePackages,
  useUpdateTimePackage,
} from "@/hooks/use-time-packages";
import { formatCentsToBRL } from "@/lib/format";
import type { TimePackage } from "@/types/billing";

type FormState = { mode: "create" } | { mode: "edit"; item: TimePackage };

export function TimePackagesSection() {
  const { data, isLoading, isError, refetch } = useTimePackages();
  const updateActive = useUpdateTimePackage();
  const removeMutation = useRemoveTimePackage();

  const [formState, setFormState] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<TimePackage | null>(null);

  function handleConfirmDelete() {
    if (!deleting) return;
    removeMutation.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Pacotes fechados</CardTitle>
        <Button size="sm" onClick={() => setFormState({ mode: "create" })}>
          <Plus data-icon="inline-start" />
          Novo pacote
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading && <Skeleton className="h-32 w-full" />}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar os pacotes.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!isLoading && !isError && data?.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum pacote cadastrado ainda.
          </p>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Minutos</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.label}</TableCell>
                  <TableCell>{item.minutes} min</TableCell>
                  <TableCell>{formatCentsToBRL(item.priceCents)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={item.active}
                      onCheckedChange={(checked) =>
                        updateActive.mutate({ id: item.id, dto: { active: checked } })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormState({ mode: "edit", item })}
                      >
                        <Pencil data-icon="inline-start" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleting(item)}
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
      </CardContent>

      <TimePackageFormDialog
        key={formState?.mode === "edit" ? formState.item.id : "create"}
        open={formState !== null}
        onOpenChange={(open) => !open && setFormState(null)}
        timePackage={formState?.mode === "edit" ? formState.item : null}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Excluir pacote "${deleting?.label ?? ""}"?`}
        description="Essa ação não pode ser desfeita."
        onConfirm={handleConfirmDelete}
        isPending={removeMutation.isPending}
      />
    </Card>
  );
}
