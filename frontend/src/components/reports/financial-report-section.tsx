"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFinancialReport } from "@/hooks/use-financial-report";
import {
  PAYMENT_PURPOSE_LABEL,
  PDV_SALE_METHOD_LABEL,
  formatCentsToBRL,
  toISODateString,
} from "@/lib/format";

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function daysAgo(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

const PRESETS = [
  { label: "Hoje", range: (today: Date) => [today, today] as const },
  {
    label: "7 dias",
    range: (today: Date) => [daysAgo(today, 6), today] as const,
  },
  {
    label: "30 dias",
    range: (today: Date) => [daysAgo(today, 29), today] as const,
  },
  {
    label: "Mês atual",
    range: (today: Date) => [startOfMonth(today), today] as const,
  },
];

export function FinancialReportSection() {
  const today = new Date();
  const [from, setFrom] = useState(toISODateString(startOfMonth(today)));
  const [to, setTo] = useState(toISODateString(today));

  const { data, isLoading, isError, refetch } = useFinancialReport(from, to);

  function applyPreset(range: (today: Date) => readonly [Date, Date]) {
    const [presetFrom, presetTo] = range(new Date());
    setFrom(toISODateString(presetFrom));
    setTo(toISODateString(presetTo));
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset.range)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-from">De</Label>
              <Input
                id="report-from"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-to">Até</Label>
              <Input
                id="report-to"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && <Skeleton className="h-32 w-full" />}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar o relatório.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Faturamento total
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatCentsToBRL(data.totalCents)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {data.paymentCount}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Ticket médio
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatCentsToBRL(data.averageTicketCents)}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Por método de pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                {data.byMethod.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum pagamento no período.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Método</TableHead>
                        <TableHead>Pagamentos</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.byMethod.map((row) => (
                        <TableRow key={row.method}>
                          <TableCell>{PDV_SALE_METHOD_LABEL[row.method]}</TableCell>
                          <TableCell>{row.count}</TableCell>
                          <TableCell className="text-right">
                            {formatCentsToBRL(row.totalCents)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Por tipo</CardTitle>
              </CardHeader>
              <CardContent>
                {data.byPurpose.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum pagamento no período.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Pagamentos</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.byPurpose.map((row) => (
                        <TableRow key={row.purpose}>
                          <TableCell>{PAYMENT_PURPOSE_LABEL[row.purpose]}</TableCell>
                          <TableCell>{row.count}</TableCell>
                          <TableCell className="text-right">
                            {formatCentsToBRL(row.totalCents)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
