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
import { HourlyRateFormDialog } from "@/components/billing/hourly-rate-form-dialog";
import {
  useHourlyRates,
  useRemoveHourlyRate,
  useUpdateHourlyRate,
} from "@/hooks/use-hourly-rates";
import { formatCentsToBRL } from "@/lib/format";
import type { HourlyRate } from "@/types/billing";

type FormState = { mode: "create" } | { mode: "edit"; item: HourlyRate };

export function HourlyRatesSection() {
  const { data, isLoading, isError, refetch } = useHourlyRates();
  const updateActive = useUpdateHourlyRate();
  const removeMutation = useRemoveHourlyRate();

  const [formState, setFormState] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<HourlyRate | null>(null);

  function handleConfirmDelete() {
    if (!deleting) return;
    removeMutation.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Tarifas por hora</CardTitle>
        <Button size="sm" onClick={() => setFormState({ mode: "create" })}>
          <Plus data-icon="inline-start" />
          Nova tarifa
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading && <Skeleton className="h-32 w-full" />}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar as tarifas.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!isLoading && !isError && data?.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma tarifa cadastrada ainda.
          </p>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço/hora</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.label}</TableCell>
                  <TableCell>
                    {formatCentsToBRL(item.ratePerHourCents)}
                  </TableCell>
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

      <HourlyRateFormDialog
        key={formState?.mode === "edit" ? formState.item.id : "create"}
        open={formState !== null}
        onOpenChange={(open) => !open && setFormState(null)}
        hourlyRate={formState?.mode === "edit" ? formState.item : null}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Excluir tarifa "${deleting?.label ?? ""}"?`}
        description="Essa ação não pode ser desfeita."
        onConfirm={handleConfirmDelete}
        isPending={removeMutation.isPending}
      />
    </Card>
  );
}
