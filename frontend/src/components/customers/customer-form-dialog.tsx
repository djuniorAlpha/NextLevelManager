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
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/use-customers";
import { ApiError } from "@/lib/api/client";
import type { Customer } from "@/types/customer";

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
}) {
  const isEditing = Boolean(customer);

  const [name, setName] = useState(customer?.name ?? "");
  const [username, setUsername] = useState(customer?.username ?? "");
  const [password, setPassword] = useState("");
  const [taxDocument, setTaxDocument] = useState(customer?.taxDocument ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");

  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const mutation = isEditing ? update : create;

  function resetForm() {
    setName("");
    setUsername("");
    setPassword("");
    setTaxDocument("");
    setEmail("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isEditing && customer) {
      update.mutate(
        {
          id: customer.id,
          dto: {
            name,
            username,
            taxDocument: taxDocument || undefined,
            email: email || undefined,
            ...(password ? { password } : {}),
          },
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      create.mutate(
        {
          name,
          username,
          password,
          taxDocument: taxDocument || undefined,
          email: email || undefined,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            resetForm();
          },
        },
      );
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
          <DialogTitle>{isEditing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            Conta de cliente com saldo pré-pago.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cust-name">Nome</Label>
            <Input
              id="cust-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cust-username">Usuário</Label>
            <Input
              id="cust-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cust-password">
              {isEditing ? "Nova senha temporária (opcional)" : "Senha temporária"}
            </Label>
            <Input
              id="cust-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required={!isEditing}
            />
            <p className="text-xs text-muted-foreground">
              {isEditing
                ? "Preencher aqui define uma nova senha temporária — o cliente vai precisar trocá-la no próximo login."
                : "O cliente vai precisar trocar essa senha no primeiro login."}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cust-tax-document">CPF/CNPJ (opcional)</Label>
            <Input
              id="cust-tax-document"
              value={taxDocument}
              onChange={(event) => setTaxDocument(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cust-email">E-mail (opcional)</Label>
            <Input
              id="cust-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Necessário pra criar uma assinatura em nome desse cliente.
            </p>
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
