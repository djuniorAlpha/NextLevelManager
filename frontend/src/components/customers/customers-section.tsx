"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/billing/confirm-delete-dialog";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { TopUpBalanceDialog } from "@/components/customers/top-up-balance-dialog";
import { useCustomers, useRemoveCustomer } from "@/hooks/use-customers";
import { LOYALTY_TIER_LABEL, formatMinutes } from "@/lib/format";
import type { Customer } from "@/types/customer";

type FormState = { mode: "create" } | { mode: "edit"; item: Customer };

export function CustomersSection() {
  const { data, isLoading, isError, refetch } = useCustomers();
  const removeMutation = useRemoveCustomer();

  const [formState, setFormState] = useState<FormState | null>(null);
  const [toppingUp, setToppingUp] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  function handleConfirmDelete() {
    if (!deleting) return;
    removeMutation.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Clientes</CardTitle>
        <Button size="sm" onClick={() => setFormState({ mode: "create" })}>
          <Plus data-icon="inline-start" />
          Novo cliente
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading && <Skeleton className="h-32 w-full" />}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar os clientes.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!isLoading && !isError && data?.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum cliente cadastrado ainda.
          </p>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Senha</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.username}</TableCell>
                  <TableCell>{formatMinutes(item.balanceMinutes)}</TableCell>
                  <TableCell>
                    {item.loyaltyTier ? LOYALTY_TIER_LABEL[item.loyaltyTier] : "—"}
                  </TableCell>
                  <TableCell>
                    {item.mustChangePassword ? (
                      <span className="text-warning">Temporária</span>
                    ) : (
                      <span className="text-muted-foreground">Definida</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormState({ mode: "edit", item })}
                      >
                        <Pencil data-icon="inline-start" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setToppingUp(item)}
                      >
                        <Wallet data-icon="inline-start" />
                        Adicionar saldo
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleting(item)}
                      >
                        <Trash2 data-icon="inline-start" />
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CustomerFormDialog
        key={formState?.mode === "edit" ? formState.item.id : "create"}
        open={formState !== null}
        onOpenChange={(open) => !open && setFormState(null)}
        customer={formState?.mode === "edit" ? formState.item : null}
      />

      <TopUpBalanceDialog
        open={toppingUp !== null}
        onOpenChange={(open) => !open && setToppingUp(null)}
        customer={toppingUp}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Excluir cliente "${deleting?.name ?? ""}"?`}
        description="Essa ação não pode ser desfeita."
        onConfirm={handleConfirmDelete}
        isPending={removeMutation.isPending}
      />
    </Card>
  );
}
