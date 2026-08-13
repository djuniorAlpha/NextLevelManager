"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { NewSaleDialog } from "@/components/pdv/new-sale-dialog";
import { usePdvSales } from "@/hooks/use-pdv";
import { PDV_SALE_METHOD_LABEL, formatCentsToBRL } from "@/lib/format";

function summarizeItems(sale: { items: { quantity: number; product: { name: string } }[] }) {
  return sale.items.map((item) => `${item.quantity}x ${item.product.name}`).join(", ");
}

export function SalesHistorySection() {
  const { data, isLoading, isError, refetch } = usePdvSales();
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Vendas</CardTitle>
        <Button size="sm" onClick={() => setSaleDialogOpen(true)}>
          <Plus data-icon="inline-start" />
          Nova venda
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading && <Skeleton className="h-32 w-full" />}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar as vendas.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!isLoading && !isError && data?.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma venda registrada ainda.
          </p>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Forma de pagamento</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {new Date(sale.createdAt).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>{summarizeItems(sale)}</TableCell>
                  <TableCell>{sale.customer?.name ?? "—"}</TableCell>
                  <TableCell>{PDV_SALE_METHOD_LABEL[sale.payment.method]}</TableCell>
                  <TableCell className="text-right">
                    {formatCentsToBRL(sale.totalCents)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <NewSaleDialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen} />
    </Card>
  );
}
