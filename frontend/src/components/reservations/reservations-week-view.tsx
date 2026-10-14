"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RESERVATION_STATUS_BADGE_CLASS,
  RESERVATION_STATUS_LABEL,
  RESERVATION_TYPE_LABEL,
} from "@/lib/format";
import type { Reservation } from "@/types/reservation";

const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function ReservationsWeekView({
  data,
  onEdit,
}: {
  data: Reservation[];
  onEdit: (reservation: Reservation) => void;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const today = new Date();
  const rangeLabel = `${days[0].toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })} – ${days[6].toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekStart((prev) => addDays(prev, -7))}
        >
          <ChevronLeft data-icon="inline-start" />
          Semana anterior
        </Button>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            {rangeLabel}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
          >
            Hoje
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekStart((prev) => addDays(prev, 7))}
        >
          Semana seguinte
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayReservations = data
            .filter((reservation) =>
              isSameDay(new Date(reservation.startAt), day),
            )
            .sort(
              (a, b) =>
                new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
            );

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex min-h-40 flex-col gap-2 rounded-lg border p-2",
                isSameDay(day, today) ? "border-accent-4" : "border-border",
              )}
            >
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {WEEKDAY_LABELS[day.getDay()]}
                </p>
                <p className="text-sm font-semibold">{day.getDate()}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                {dayReservations.length === 0 ? (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    —
                  </p>
                ) : (
                  dayReservations.map((reservation) => (
                    <button
                      key={reservation.id}
                      type="button"
                      onClick={() => onEdit(reservation)}
                      className="flex flex-col gap-0.5 rounded-md border border-border p-1.5 text-left text-xs transition-colors hover:border-accent-4"
                    >
                      <span className="font-medium">
                        {new Date(reservation.startAt).toLocaleTimeString(
                          "pt-BR",
                          { hour: "2-digit", minute: "2-digit" },
                        )}{" "}
                        · {RESERVATION_TYPE_LABEL[reservation.type]}
                      </span>
                      <span className="truncate text-muted-foreground">
                        {reservation.customer?.name ?? reservation.guestName}
                      </span>
                      <Badge
                        className={cn(
                          "w-fit",
                          RESERVATION_STATUS_BADGE_CLASS[reservation.status],
                        )}
                      >
                        {RESERVATION_STATUS_LABEL[reservation.status]}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
