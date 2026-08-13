"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/billing/confirm-delete-dialog";
import { NewSubscriptionDialog } from "@/components/subscriptions/new-subscription-dialog";
import { useAllSubscriptions, useCancelSubscription } from "@/hooks/use-subscriptions";
import {
  SUBSCRIPTION_STATUS_BADGE_CLASS,
  SUBSCRIPTION_STATUS_LABEL,
  formatMinutes,
} from "@/lib/format";
import type { CustomerSubscription } from "@/types/subscription";

const CANCELABLE_STATUSES = new Set(["pending", "active"]);

export function SubscribersSection() {
  const { data, isLoading, isError, refetch } = useAllSubscriptions();
  const cancelMutation = useCancelSubscription();

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [canceling, setCanceling] = useState<CustomerSubscription | null>(null);

  function handleConfirmCancel() {
    if (!canceling) return;
    cancelMutation.mutate(
      { customerId: canceling.customerId, subscriptionId: canceling.id },
      { onSuccess: () => setCanceling(null) },
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Assinantes</CardTitle>
        <Button size="sm" onClick={() => setNewDialogOpen(true)}>
          <Plus data-icon="inline-start" />
          Nova assinatura
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading && <Skeleton className="h-32 w-full" />}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar os assinantes.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!isLoading && !isError && data?.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma assinatura registrada ainda.
          </p>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Minutos restantes</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>{subscription.customer?.name ?? "—"}</TableCell>
                  <TableCell>{subscription.plan.name}</TableCell>
                  <TableCell>
                    <Badge className={SUBSCRIPTION_STATUS_BADGE_CLASS[subscription.status]}>
                      {SUBSCRIPTION_STATUS_LABEL[subscription.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {subscription.includedMinutesRemaining != null
                      ? formatMinutes(subscription.includedMinutesRemaining)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {CANCELABLE_STATUSES.has(subscription.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setCanceling(subscription)}
                      >
                        <X data-icon="inline-start" />
                        Cancelar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <NewSubscriptionDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} />

      <ConfirmDeleteDialog
        open={canceling !== null}
        onOpenChange={(open) => !open && setCanceling(null)}
        title={`Cancelar assinatura de "${canceling?.customer?.name ?? ""}"?`}
        description="Essa ação não pode ser desfeita."
        onConfirm={handleConfirmCancel}
        isPending={cancelMutation.isPending}
        confirmLabel="Cancelar assinatura"
        pendingLabel="Cancelando..."
      />
    </Card>
  );
}
