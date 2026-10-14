"use client";

import { useMemo, useState } from "react";
import { CalendarRange, List, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDeleteDialog } from "@/components/billing/confirm-delete-dialog";
import { ReservationFormDialog } from "@/components/reservations/reservation-form-dialog";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { ReservationsWeekView } from "@/components/reservations/reservations-week-view";
import {
  useRemoveReservation,
  useReservations,
} from "@/hooks/use-reservations";
import { RESERVATION_TYPE_LABEL } from "@/lib/format";
import type { Reservation, ReservationType } from "@/types/reservation";

type FormState =
  | { mode: "create" }
  | { mode: "edit"; reservation: Reservation };

type ViewMode = "list" | "week";

const TYPE_FILTER_OPTIONS: Array<ReservationType | "all"> = [
  "all",
  "pc",
  "console",
  "room",
];

export function ReservationsSection() {
  const { data, isLoading, isError, refetch } = useReservations();
  const removeMutation = useRemoveReservation();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ReservationType | "all">("all");
  const [formState, setFormState] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<Reservation | null>(null);

  function handleConfirmDelete() {
    if (!deleting) return;
    removeMutation.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
    });
  }

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((reservation) => {
      if (typeFilter !== "all" && reservation.type !== typeFilter) {
        return false;
      }
      if (!term) return true;
      const who = reservation.customer?.name ?? reservation.guestName ?? "";
      return who.toLowerCase().includes(term);
    });
  }, [data, search, typeFilter]);

  function handleEdit(reservation: Reservation) {
    setFormState({ mode: "edit", reservation });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Agendamentos</CardTitle>
        <Button size="sm" onClick={() => setFormState({ mode: "create" })}>
          <Plus data-icon="inline-start" />
          Nova reserva
        </Button>
      </CardHeader>

      <CardContent>
        {!isLoading && !isError && data && data.length > 0 && (
          <div className="mb-4 flex gap-3">
            <div className="relative flex-1">
              <Search
                data-icon="input-start"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por cliente ou visitante..."
                className="pl-9"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(value as ReservationType | "all")
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "all" ? "Todos" : RESERVATION_TYPE_LABEL[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List data-icon="inline-start" />
                Lista
              </Button>
              <Button
                variant={viewMode === "week" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("week")}
              >
                <CalendarRange data-icon="inline-start" />
                Semana
              </Button>
            </div>
          </div>
        )}

        {isLoading && <Skeleton className="h-32 w-full" />}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar os agendamentos.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!isLoading && !isError && data?.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma reserva cadastrada ainda.
          </p>
        )}

        {!isLoading &&
          !isError &&
          data &&
          data.length > 0 &&
          filteredData.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma reserva encontrada.
            </p>
          )}

        {!isLoading &&
          !isError &&
          filteredData.length > 0 &&
          (viewMode === "list" ? (
            <ReservationsTable
              data={filteredData}
              onEdit={handleEdit}
              onDelete={setDeleting}
            />
          ) : (
            <ReservationsWeekView data={filteredData} onEdit={handleEdit} />
          ))}
      </CardContent>

      <ReservationFormDialog
        key={
          formState?.mode === "edit" ? formState.reservation.id : "create"
        }
        open={formState !== null}
        onOpenChange={(open) => !open && setFormState(null)}
        reservation={formState?.mode === "edit" ? formState.reservation : null}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Excluir reserva de "${deleting?.customer?.name ?? deleting?.guestName ?? ""}"?`}
        description="Essa ação não pode ser desfeita."
        onConfirm={handleConfirmDelete}
        isPending={removeMutation.isPending}
      />
    </Card>
  );
}
