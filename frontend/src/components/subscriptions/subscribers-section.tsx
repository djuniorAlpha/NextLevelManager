"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Plus, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { ChangePlanDialog } from "@/components/subscriptions/change-plan-dialog";
import { NewSubscriptionDialog } from "@/components/subscriptions/new-subscription-dialog";
import { useAllSubscriptions, useCancelSubscription } from "@/hooks/use-subscriptions";
import {
  SUBSCRIPTION_STATUS_BADGE_CLASS,
  SUBSCRIPTION_STATUS_LABEL,
  formatMinutes,
} from "@/lib/format";
import type { CustomerSubscription } from "@/types/subscription";

// Assinatura "em aberto" — mesmo critério do backend (OPEN_SUBSCRIPTION_STATUSES
// em subscriptions.service.ts) pra permitir cancelar ou trocar de plano.
const OPEN_STATUSES = new Set(["pending", "active", "past_due"]);

export function SubscribersSection() {
  const { data, isLoading, isError, refetch } = useAllSubscriptions();
  const cancelMutation = useCancelSubscription();

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [canceling, setCanceling] = useState<CustomerSubscription | null>(null);
  const [changingPlan, setChangingPlan] = useState<CustomerSubscription | null>(
    null,
  );
  const [search, setSearch] = useState("");

  function handleConfirmCancel() {
    if (!canceling) return;
    cancelMutation.mutate(
      { customerId: canceling.customerId, subscriptionId: canceling.id },
      { onSuccess: () => setCanceling(null) },
    );
  }

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter((subscription) =>
      [subscription.customer?.name, subscription.plan.name]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term)),
    );
  }, [data, search]);

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
        {!isLoading && !isError && data && data.length > 0 && (
          <div className="relative mb-4">
            <Search
              data-icon="input-start"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por cliente ou plano..."
              className="pl-9"
            />
          </div>
        )}

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

        {!isLoading && !isError && data && data.length > 0 && filteredData.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma assinatura encontrada para &quot;{search}&quot;.
          </p>
        )}

        {!isLoading && !isError && filteredData.length > 0 && (
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
              {filteredData.map((subscription) => (
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
                    {OPEN_STATUSES.has(subscription.status) && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setChangingPlan(subscription)}
                        >
                          <ArrowLeftRight data-icon="inline-start" />
                          Trocar plano
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setCanceling(subscription)}
                        >
                          <X data-icon="inline-start" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <NewSubscriptionDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} />

      <ChangePlanDialog
        open={changingPlan !== null}
        onOpenChange={(open) => !open && setChangingPlan(null)}
        subscription={changingPlan}
      />

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
