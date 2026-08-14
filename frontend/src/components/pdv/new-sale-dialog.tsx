"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
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
import { useAllSubscriptions } from "@/hooks/use-subscriptions";
import { useCreatePdvSale } from "@/hooks/use-pdv";
import { useProducts } from "@/hooks/use-products";
import { ApiError } from "@/lib/api/client";
import { PDV_SALE_METHOD_LABEL, formatCentsToBRL } from "@/lib/format";
import type { PdvSaleMethod } from "@/types/pdv";

const METHOD_OPTIONS: PdvSaleMethod[] = ["cash", "pix", "credit_card", "debit_card"];

type CartLine = { productId: string; quantity: number };

export function NewSaleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: products } = useProducts();
  const { data: subscriptions } = useAllSubscriptions();
  const createSale = useCreatePdvSale();

  const [cart, setCart] = useState<CartLine[]>([]);
  const [pickedProductId, setPickedProductId] = useState("");
  const [pickedQuantity, setPickedQuantity] = useState("1");
  const [method, setMethod] = useState<PdvSaleMethod>("cash");
  const [customerId, setCustomerId] = useState("");

  const activeProducts = (products ?? []).filter((product) => product.active);

  const customerOptions: ComboboxOption[] = [
    { value: "", label: "Sem cliente" },
    ...(subscriptions ?? [])
      .filter((subscription) => subscription.status === "active" && subscription.customer)
      .map((subscription) => ({
        value: subscription.customerId,
        label: subscription.plan.pdvDiscountPercent
          ? `${subscription.customer!.name} — ${subscription.plan.pdvDiscountPercent}% off`
          : subscription.customer!.name,
      })),
  ];

  // Mesma regra de `pdv.service.ts#createSale`: só aplica o desconto do plano
  // quando o cliente selecionado tem uma assinatura ativa com pdvDiscountPercent.
  const activeSubscription = (subscriptions ?? []).find(
    (subscription) => subscription.customerId === customerId && subscription.status === "active",
  );
  const discountPercent = activeSubscription?.plan.pdvDiscountPercent ?? null;

  const lineItems = cart
    .map((line) => ({
      product: activeProducts.find((product) => product.id === line.productId),
      quantity: line.quantity,
    }))
    .filter(
      (line): line is { product: NonNullable<typeof line.product>; quantity: number } =>
        Boolean(line.product),
    )
    .map((line) => ({
      ...line,
      unitPriceCents: discountPercent
        ? Math.round(line.product.priceCents * (1 - discountPercent / 100))
        : line.product.priceCents,
    }));

  const totalCents = lineItems.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0,
  );

  function resetForm() {
    setCart([]);
    setPickedProductId("");
    setPickedQuantity("1");
    setMethod("cash");
    setCustomerId("");
  }

  function handleAddItem() {
    const quantity = Math.max(1, Number(pickedQuantity) || 0);
    if (!pickedProductId || quantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((line) => line.productId === pickedProductId);
      if (existing) {
        return prev.map((line) =>
          line.productId === pickedProductId
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        );
      }
      return [...prev, { productId: pickedProductId, quantity }];
    });

    setPickedProductId("");
    setPickedQuantity("1");
  }

  function handleRemoveItem(productId: string) {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  }

  function handleQuantityChange(productId: string, quantity: number) {
    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId
          ? { ...line, quantity: Math.max(1, quantity) }
          : line,
      ),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lineItems.length === 0) return;

    createSale.mutate(
      {
        items: cart.map((line) => ({
          productId: line.productId,
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
            Venda no balcão — adicione os produtos e a quantidade de cada um.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {activeProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum produto ativo cadastrado ainda.
            </p>
          ) : (
            <div className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="sale-add-product">Produto</Label>
                <Select value={pickedProductId} onValueChange={setPickedProductId}>
                  <SelectTrigger id="sale-add-product">
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} — {formatCentsToBRL(product.priceCents)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-20 flex-col gap-1.5">
                <Label htmlFor="sale-add-quantity">Qtd.</Label>
                <Input
                  id="sale-add-quantity"
                  type="number"
                  min={1}
                  step={1}
                  value={pickedQuantity}
                  onChange={(event) => setPickedQuantity(event.target.value)}
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleAddItem}
                disabled={!pickedProductId}
              >
                <Plus data-icon="inline-start" />
                Adicionar
              </Button>
            </div>
          )}

          {lineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum item adicionado ainda.
            </p>
          ) : (
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {lineItems.map((line) => (
                <div key={line.product.id} className="flex items-center gap-3">
                  <div className="flex-1 text-sm">
                    <p>{line.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {discountPercent ? (
                        <>
                          <span className="line-through">
                            {formatCentsToBRL(line.product.priceCents)}
                          </span>{" "}
                          {formatCentsToBRL(line.unitPriceCents)} un. —{" "}
                        </>
                      ) : (
                        <>{formatCentsToBRL(line.unitPriceCents)} un. — </>
                      )}
                      {formatCentsToBRL(line.unitPriceCents * line.quantity)}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    className="w-20"
                    value={line.quantity}
                    onChange={(event) =>
                      handleQuantityChange(
                        line.product.id,
                        Number(event.target.value) || 1,
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() => handleRemoveItem(line.product.id)}
                  >
                    <Trash2 />
                    <span className="sr-only">Remover</span>
                  </Button>
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
              <Combobox
                value={customerId}
                onValueChange={setCustomerId}
                options={customerOptions}
                placeholder="Sem cliente"
                searchPlaceholder="Buscar cliente..."
                emptyText="Nenhum cliente com assinatura ativa encontrado."
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              Total
              {discountPercent ? ` (${discountPercent}% off aplicado)` : ""}
            </span>
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
