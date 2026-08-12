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
  useCreateHourlyRate,
  useUpdateHourlyRate,
} from "@/hooks/use-hourly-rates";
import { ApiError } from "@/lib/api/client";
import type { HourlyRate } from "@/types/billing";

export function HourlyRateFormDialog({
  open,
  onOpenChange,
  hourlyRate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hourlyRate?: HourlyRate | null;
}) {
  const isEditing = Boolean(hourlyRate);

  const [label, setLabel] = useState(hourlyRate?.label ?? "");
  const [rateReais, setRateReais] = useState(
    hourlyRate ? (hourlyRate.ratePerHourCents / 100).toFixed(2) : "",
  );

  const create = useCreateHourlyRate();
  const update = useUpdateHourlyRate();
  const mutation = isEditing ? update : create;

  function resetForm() {
    setLabel("");
    setRateReais("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dto = {
      label,
      ratePerHourCents: Math.round(Number(rateReais) * 100),
    };

    if (isEditing && hourlyRate) {
      update.mutate(
        { id: hourlyRate.id, dto },
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
          <DialogTitle>{isEditing ? "Editar tarifa" : "Nova tarifa"}</DialogTitle>
          <DialogDescription>
            Tarifa por hora corrida pra PC (ex.: &quot;Tarifa padrão&quot;, R$ 6,00/h).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hr-label">Nome</Label>
            <Input
              id="hr-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hr-rate">Preço por hora (R$)</Label>
            <Input
              id="hr-rate"
              type="number"
              min={0}
              step={0.01}
              value={rateReais}
              onChange={(event) => setRateReais(event.target.value)}
              required
            />
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
