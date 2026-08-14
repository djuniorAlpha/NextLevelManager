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
import { Label } from "@/components/ui/label";
import { useSubscriptionPlans } from "@/hooks/use-subscription-plans";
import { useChangeSubscriptionPlan } from "@/hooks/use-subscriptions";
import { ApiError } from "@/lib/api/client";
import type { CustomerSubscription } from "@/types/subscription";

const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-full border border-input bg-transparent px-3 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 md:text-sm dark:bg-input/30";

export function ChangePlanDialog({
  open,
  onOpenChange,
  subscription,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: CustomerSubscription | null;
}) {
  const { data: plans } = useSubscriptionPlans();
  const changePlan = useChangeSubscriptionPlan();

  const [planId, setPlanId] = useState("");

  const otherActivePlans = (plans ?? []).filter(
    (plan) => plan.active && plan.id !== subscription?.planId,
  );

  function resetForm() {
    setPlanId("");
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subscription) return;

    changePlan.mutate(
      {
        customerId: subscription.customerId,
        subscriptionId: subscription.id,
        planId,
      },
      { onSuccess: () => handleClose(false) },
    );
  }

  const errorMessage =
    changePlan.error instanceof ApiError
      ? changePlan.error.message
      : changePlan.isError
        ? "Não foi possível trocar o plano."
        : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trocar de plano</DialogTitle>
          <DialogDescription>
            {subscription
              ? `Cliente: ${subscription.customer?.name ?? ""} — plano atual: ${subscription.plan.name}.`
              : ""}
            {" "}O valor cobrado no Mercado Pago muda a partir da próxima cobrança;
            os minutos inclusos do plano novo já valem na hora.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="change-plan-select">Plano novo</Label>
            <select
              id="change-plan-select"
              className={SELECT_CLASS}
              value={planId}
              onChange={(event) => setPlanId(event.target.value)}
              required
            >
              <option value="" disabled>
                Selecione um plano
              </option>
              {otherActivePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
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
              onClick={() => handleClose(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={changePlan.isPending || !planId}>
              {changePlan.isPending ? "Trocando..." : "Trocar plano"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
