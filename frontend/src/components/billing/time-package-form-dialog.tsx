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
  useCreateTimePackage,
  useUpdateTimePackage,
} from "@/hooks/use-time-packages";
import { ApiError } from "@/lib/api/client";
import type { TimePackage } from "@/types/billing";

export function TimePackageFormDialog({
  open,
  onOpenChange,
  timePackage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timePackage?: TimePackage | null;
}) {
  const isEditing = Boolean(timePackage);

  const [label, setLabel] = useState(timePackage?.label ?? "");
  const [minutes, setMinutes] = useState(
    timePackage ? String(timePackage.minutes) : "",
  );
  const [priceReais, setPriceReais] = useState(
    timePackage ? (timePackage.priceCents / 100).toFixed(2) : "",
  );

  const create = useCreateTimePackage();
  const update = useUpdateTimePackage();
  const mutation = isEditing ? update : create;

  function resetForm() {
    setLabel("");
    setMinutes("");
    setPriceReais("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dto = {
      label,
      minutes: Number(minutes),
      priceCents: Math.round(Number(priceReais) * 100),
    };

    if (isEditing && timePackage) {
      update.mutate(
        { id: timePackage.id, dto },
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
          <DialogTitle>{isEditing ? "Editar pacote" : "Novo pacote"}</DialogTitle>
          <DialogDescription>
            Pacote fechado de tempo pra PC (ex.: &quot;1 hora&quot;, R$ 5,00).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tp-label">Nome</Label>
            <Input
              id="tp-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tp-minutes">Minutos</Label>
              <Input
                id="tp-minutes"
                type="number"
                min={1}
                step={1}
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tp-price">Preço (R$)</Label>
              <Input
                id="tp-price"
                type="number"
                min={0}
                step={0.01}
                value={priceReais}
                onChange={(event) => setPriceReais(event.target.value)}
                required
              />
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
