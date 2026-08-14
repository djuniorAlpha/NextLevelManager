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
import { useCustomers } from "@/hooks/use-customers";
import { useCreatePdvSale } from "@/hooks/use-pdv";
import { useProducts } from "@/hooks/use-products";
import { ApiError } from "@/lib/api/client";
import { PDV_SALE_METHOD_LABEL, formatCentsToBRL } from "@/lib/format";
import type { PdvSaleMethod } from "@/types/pdv";

const METHOD_OPTIONS: PdvSaleMethod[] = ["cash", "pix", "credit_card", "debit_card"];

// Radix Select não aceita value="" num Item (reservado pra "nada selecionado") —
// usa esse sentinel pra representar "Sem cliente" e converte de volta ao enviar.
const NO_CUSTOMER = "none";

export function NewSaleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: products } = useProducts();
  const { data: customers } = useCustomers();
  const createSale = useCreatePdvSale();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<PdvSaleMethod>("cash");
  const [customerId, setCustomerId] = useState("");

  const activeProducts = (products ?? []).filter((product) => product.active);

  const lineItems = activeProducts
    .map((product) => ({ product, quantity: quantities[product.id] ?? 0 }))
    .filter((line) => line.quantity > 0);

  const totalCents = lineItems.reduce(
    (sum, line) => sum + line.product.priceCents * line.quantity,
    0,
  );

  function resetForm() {
    setQuantities({});
    setMethod("cash");
    setCustomerId("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lineItems.length === 0) return;

    createSale.mutate(
      {
        items: lineItems.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        })),
        method,
        customerId: customerId || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      },
    );
  }

  const errorMessage =
    createSale.error instanceof ApiError
      ? createSale.error.message
      : createSale.isError
        ? "Não foi possível registrar a venda."
        : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova venda</DialogTitle>
          <DialogDescription>
            Venda no balcão — informe a quantidade de cada produto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {activeProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum produto ativo cadastrado ainda.
            </p>
          ) : (
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {activeProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="flex-1 text-sm">
                    <p>{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCentsToBRL(product.priceCents)}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    className="w-20"
                    value={quantities[product.id] ?? ""}
                    onChange={(event) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [product.id]: Math.max(0, Number(event.target.value) || 0),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sale-method">Forma de pagamento</Label>
              <Select
                value={method}
                onValueChange={(value) => setMethod(value as PdvSaleMethod)}
              >
                <SelectTrigger id="sale-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {PDV_SALE_METHOD_LABEL[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sale-customer">Cliente (opcional)</Label>
              <Select
                value={customerId || NO_CUSTOMER}
                onValueChange={(value) =>
                  setCustomerId(value === NO_CUSTOMER ? "" : value)
                }
              >
                <SelectTrigger id="sale-customer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CUSTOMER}>Sem cliente</SelectItem>
                  {(customers ?? []).map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">{formatCentsToBRL(totalCents)}</span>
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
            <Button
              type="submit"
              disabled={createSale.isPending || lineItems.length === 0}
            >
              {createSale.isPending ? "Registrando..." : "Registrar venda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
