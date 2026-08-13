"use client";

import { useState, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
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
import { useCustomers } from "@/hooks/use-customers";
import { useSubscriptionPlans } from "@/hooks/use-subscription-plans";
import { useCreateSubscription } from "@/hooks/use-subscriptions";
import { ApiError } from "@/lib/api/client";
import type { CreateSubscriptionResult } from "@/types/subscription";

const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-full border border-input bg-transparent px-3 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 md:text-sm dark:bg-input/30";

export function NewSubscriptionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: customers } = useCustomers();
  const { data: plans } = useSubscriptionPlans();
  const createSubscription = useCreateSubscription();

  const [customerId, setCustomerId] = useState("");
  const [planId, setPlanId] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [result, setResult] = useState<CreateSubscriptionResult | null>(null);

  const activePlans = (plans ?? []).filter((plan) => plan.active);
  const selectedCustomer = (customers ?? []).find((c) => c.id === customerId);
  const needsEmail = Boolean(selectedCustomer) && !selectedCustomer?.email;

  function resetForm() {
    setCustomerId("");
    setPlanId("");
    setPayerEmail("");
    setResult(null);
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    createSubscription.mutate(
      {
        customerId,
        dto: { planId, payerEmail: payerEmail || undefined },
      },
      { onSuccess: (data) => setResult(data) },
    );
  }

  function handleCopyLink() {
    if (!result?.checkoutUrl) return;
    navigator.clipboard.writeText(result.checkoutUrl);
    toast.success("Link copiado");
  }

  const errorMessage =
    createSubscription.error instanceof ApiError
      ? createSubscription.error.message
      : createSubscription.isError
        ? "Não foi possível criar a assinatura."
        : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova assinatura</DialogTitle>
          <DialogDescription>
            {result
              ? "Assinatura criada — mande esse link pro cliente completar o cadastro do cartão."
              : "Escolha o cliente e o plano. O cliente completa o cadastro do cartão pelo link do Mercado Pago."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center gap-4">
            {result.checkoutUrl && (
              <div className="rounded-lg bg-white p-3">
                <QRCodeSVG value={result.checkoutUrl} size={200} />
              </div>
            )}
            <Input readOnly value={result.checkoutUrl ?? ""} />
            <DialogFooter className="w-full">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLink}
                disabled={!result.checkoutUrl}
              >
                Copiar link
              </Button>
              <Button type="button" onClick={() => handleClose(false)}>
                Concluir
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-customer">Cliente</Label>
              <select
                id="sub-customer"
                className={SELECT_CLASS}
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione um cliente
                </option>
                {(customers ?? []).map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-plan">Plano</Label>
              <select
                id="sub-plan"
                className={SELECT_CLASS}
                value={planId}
                onChange={(event) => setPlanId(event.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione um plano
                </option>
                {activePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {needsEmail && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sub-email">E-mail do cliente</Label>
                <Input
                  id="sub-email"
                  type="email"
                  value={payerEmail}
                  onChange={(event) => setPayerEmail(event.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Esse cliente ainda não tem e-mail cadastrado — o Mercado Pago
                  exige um pra criar a assinatura.
                </p>
              </div>
            )}

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
              <Button type="submit" disabled={createSubscription.isPending}>
                {createSubscription.isPending ? "Criando..." : "Criar assinatura"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
