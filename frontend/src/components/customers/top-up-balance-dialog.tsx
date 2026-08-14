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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTopUpCustomerBalance } from "@/hooks/use-top-up-customer-balance";
import { formatMinutes } from "@/lib/format";
import type { Customer, TopUpMethod } from "@/types/customer";

const METHOD_OPTIONS: { value: TopUpMethod; label: string }[] = [
  { value: "cash", label: "Dinheiro" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "debit_card", label: "Cartão de débito" },
];

export function TopUpBalanceDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}) {
  const [minutes, setMinutes] = useState("");
  const [amountReais, setAmountReais] = useState("");
  const [method, setMethod] = useState<TopUpMethod>("cash");

  const topUp = useTopUpCustomerBalance();

  function resetForm() {
    setMinutes("");
    setAmountReais("");
    setMethod("cash");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customer) return;

    topUp.mutate(
      {
        customerId: customer.id,
        dto: {
          minutes: Number(minutes),
          amountCents: Math.round(Number(amountReais) * 100),
          method,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar saldo</DialogTitle>
          <DialogDescription>
            {customer
              ? `Cliente: ${customer.name} — saldo atual: ${formatMinutes(customer.balanceMinutes)}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="topup-minutes">Minutos a creditar</Label>
            <Input
              id="topup-minutes"
              type="number"
              min={1}
              step={1}
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="topup-amount">Valor recebido (R$)</Label>
              <Input
                id="topup-amount"
                type="number"
                min={0}
                step={0.01}
                value={amountReais}
                onChange={(event) => setAmountReais(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="topup-method">Forma de pagamento</Label>
              <Select
                value={method}
                onValueChange={(value) => setMethod(value as TopUpMethod)}
              >
                <SelectTrigger id="topup-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={topUp.isPending || !customer}>
              {topUp.isPending ? "Adicionando..." : "Adicionar saldo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
