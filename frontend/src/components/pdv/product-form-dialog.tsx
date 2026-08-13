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
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { ApiError } from "@/lib/api/client";
import type { Product } from "@/types/product";

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}) {
  const isEditing = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [priceReais, setPriceReais] = useState(
    product ? (product.priceCents / 100).toFixed(2) : "",
  );

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const mutation = isEditing ? update : create;

  function resetForm() {
    setName("");
    setPriceReais("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dto = {
      name,
      priceCents: Math.round(Number(priceReais) * 100),
    };

    if (isEditing && product) {
      update.mutate(
        { id: product.id, dto },
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
          <DialogTitle>{isEditing ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            Produto do PDV (bebidas, snacks, etc.), sem controle de estoque.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prod-name">Nome</Label>
            <Input
              id="prod-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prod-price">Preço (R$)</Label>
            <Input
              id="prod-price"
              type="number"
              min={0}
              step={0.01}
              value={priceReais}
              onChange={(event) => setPriceReais(event.target.value)}
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
