"use client";

import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
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
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
} from "@/hooks/use-subscription-plans";
import { ApiError } from "@/lib/api/client";
import type { SubscriptionPlan } from "@/types/subscription";

export function PlanFormDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: SubscriptionPlan | null;
}) {
  const isEditing = Boolean(plan);

  const [name, setName] = useState(plan?.name ?? "");
  const [priceReais, setPriceReais] = useState(
    plan ? (plan.priceCents / 100).toFixed(2) : "",
  );
  const [includedHours, setIncludedHours] = useState(
    plan?.includedMinutes ? String(plan.includedMinutes / 60) : "",
  );
  const [pdvDiscountPercent, setPdvDiscountPercent] = useState(
    plan?.pdvDiscountPercent ? String(plan.pdvDiscountPercent) : "",
  );
  const [maxActiveSubscribers, setMaxActiveSubscribers] = useState(
    plan?.maxActiveSubscribers ? String(plan.maxActiveSubscribers) : "",
  );
  const [perks, setPerks] = useState<string[]>(plan?.perks ?? []);

  const create = useCreateSubscriptionPlan();
  const update = useUpdateSubscriptionPlan();
  const mutation = isEditing ? update : create;

  function resetForm() {
    setName("");
    setPriceReais("");
    setIncludedHours("");
    setPdvDiscountPercent("");
    setMaxActiveSubscribers("");
    setPerks([]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dto = {
      name,
      priceCents: Math.round(Number(priceReais) * 100),
      includedMinutes: includedHours ? Number(includedHours) * 60 : undefined,
      pdvDiscountPercent: pdvDiscountPercent
        ? Number(pdvDiscountPercent)
        : undefined,
      maxActiveSubscribers: maxActiveSubscribers
        ? Number(maxActiveSubscribers)
        : undefined,
      perks: perks.filter((perk) => perk.trim().length > 0),
    };

    if (isEditing && plan) {
      update.mutate(
        { id: plan.id, dto },
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
          <DialogTitle>{isEditing ? "Editar plano" : "Novo plano"}</DialogTitle>
          <DialogDescription>
            Plano de assinatura mensal (ex.: &quot;Player Pass&quot;).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-name">Nome</Label>
            <Input
              id="plan-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-price">Preço mensal (R$)</Label>
              <Input
                id="plan-price"
                type="number"
                min={0}
                step={0.01}
                value={priceReais}
                onChange={(event) => setPriceReais(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-hours">Horas inclusas/mês</Label>
              <Input
                id="plan-hours"
                type="number"
                min={0}
                step={1}
                value={includedHours}
                onChange={(event) => setIncludedHours(event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-pdv-discount">Desconto no PDV (%)</Label>
              <Input
                id="plan-pdv-discount"
                type="number"
                min={0}
                max={100}
                step={1}
                value={pdvDiscountPercent}
                onChange={(event) => setPdvDiscountPercent(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-max-subscribers">
                Limite de assinantes (opcional)
              </Label>
              <Input
                id="plan-max-subscribers"
                type="number"
                min={1}
                step={1}
                value={maxActiveSubscribers}
                onChange={(event) => setMaxActiveSubscribers(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Outros benefícios (só descritivo)</Label>
            <div className="flex flex-col gap-2">
              {perks.map((perk, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={perk}
                    onChange={(event) =>
                      setPerks((prev) =>
                        prev.map((item, i) =>
                          i === index ? event.target.value : item,
                        ),
                      )
                    }
                    placeholder="Ex.: Prioridade em reservas"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setPerks((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPerks((prev) => [...prev, ""])}
              >
                <Plus data-icon="inline-start" />
                Adicionar benefício
              </Button>
            </div>
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
