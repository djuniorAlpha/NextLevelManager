"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePixTokens } from "@/hooks/use-pix-tokens";
import {
  PIX_TOKEN_STATUS_BADGE_CLASS,
  PIX_TOKEN_STATUS_LABEL,
  formatCentsToBRL,
  formatSeconds,
} from "@/lib/format";

export function PixTokensSection() {
  const { data, isLoading, isError, refetch } = usePixTokens();
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter((token) =>
      [token.code, token.payment.externalPaymentId]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term)),
    );
  }, [data, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de tokens Pix</CardTitle>
      </CardHeader>

      <CardContent>
        {!isLoading && !isError && data && data.length > 0 && (
          <div className="relative mb-4">
            <Search
              data-icon="input-start"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por código do token ou do Pix..."
              className="pl-9"
            />
          </div>
        )}

        {isLoading && <Skeleton className="h-32 w-full" />}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar os tokens.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!isLoading && !isError && data?.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum token gerado ainda.
          </p>
        )}

        {!isLoading &&
          !isError &&
          data &&
          data.length > 0 &&
          filteredData.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum token encontrado para &quot;{search}&quot;.
            </p>
          )}

        {!isLoading && !isError && filteredData.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código do token</TableHead>
                  <TableHead>Código do Pix</TableHead>
                  <TableHead>Valor pago</TableHead>
                  <TableHead>Tempo total</TableHead>
                  <TableHead>Tempo restante</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="font-mono">{token.code}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {token.payment.externalPaymentId ?? "—"}
                    </TableCell>
                    <TableCell>
                      {formatCentsToBRL(token.payment.amountCents)}
                    </TableCell>
                    <TableCell>{formatSeconds(token.totalSeconds)}</TableCell>
                    <TableCell>{formatSeconds(token.remainingSeconds)}</TableCell>
                    <TableCell>
                      {new Date(token.expiresAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge className={PIX_TOKEN_STATUS_BADGE_CLASS[token.status]}>
                        {PIX_TOKEN_STATUS_LABEL[token.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
