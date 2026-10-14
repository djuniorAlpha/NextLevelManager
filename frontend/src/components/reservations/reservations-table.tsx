"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RESERVATION_STATUS_BADGE_CLASS,
  RESERVATION_STATUS_LABEL,
  RESERVATION_TYPE_LABEL,
  formatMinutes,
} from "@/lib/format";
import type { Reservation } from "@/types/reservation";

export function ReservationsTable({
  data,
  onEdit,
  onDelete,
}: {
  data: Reservation[];
  onEdit: (reservation: Reservation) => void;
  onDelete: (reservation: Reservation) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Início</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((reservation) => (
            <TableRow key={reservation.id}>
              <TableCell>{RESERVATION_TYPE_LABEL[reservation.type]}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>
                    {reservation.customer?.name ?? reservation.guestName}
                  </span>
                  {!reservation.customer && reservation.guestPhone && (
                    <span className="text-xs text-muted-foreground">
                      {reservation.guestPhone}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {new Date(reservation.startAt).toLocaleString("pt-BR")}
              </TableCell>
              <TableCell>
                {formatMinutes(reservation.durationMinutes)}
              </TableCell>
              <TableCell>
                <Badge
                  className={RESERVATION_STATUS_BADGE_CLASS[reservation.status]}
                >
                  {RESERVATION_STATUS_LABEL[reservation.status]}
                </Badge>
                {reservation.status === "pending" &&
                  reservation.pendingNote && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {reservation.pendingNote}
                    </p>
                  )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(reservation)}
                  >
                    <Pencil data-icon="inline-start" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => onDelete(reservation)}
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
    </div>
  );
}
