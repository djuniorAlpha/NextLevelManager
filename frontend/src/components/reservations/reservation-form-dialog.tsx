"use client";

import { useState, type FormEvent } from "react";
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
import { useCustomers } from "@/hooks/use-customers";
import {
  useCreateReservation,
  useUpdateReservation,
} from "@/hooks/use-reservations";
import { ApiError } from "@/lib/api/client";
import { RESERVATION_STATUS_LABEL, RESERVATION_TYPE_LABEL } from "@/lib/format";
import type {
  Reservation,
  ReservationStatus,
  ReservationType,
} from "@/types/reservation";

const TYPE_OPTIONS: ReservationType[] = ["pc", "console", "room"];
const STATUS_OPTIONS: ReservationStatus[] = [
  "confirmed",
  "pending",
  "completed",
  "canceled",
];

type CustomerMode = "registered" | "guest";

// Datetime-local não aceita ISO com timezone, precisa do formato local sem "Z".
function toDatetimeLocalValue(isoDate: string): string {
  const date = new Date(isoDate);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ReservationFormDialog({
  open,
  onOpenChange,
  reservation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation?: Reservation | null;
}) {
  const isEditing = Boolean(reservation);
  const { data: customers } = useCustomers();

  const [type, setType] = useState<ReservationType>(
    reservation?.type ?? "pc",
  );
  const [customerMode, setCustomerMode] = useState<CustomerMode>(
    reservation?.customerId ? "registered" : "guest",
  );
  const [customerId, setCustomerId] = useState(reservation?.customerId ?? "");
  const [guestName, setGuestName] = useState(reservation?.guestName ?? "");
  const [guestPhone, setGuestPhone] = useState(reservation?.guestPhone ?? "");
  const [startAt, setStartAt] = useState(
    reservation ? toDatetimeLocalValue(reservation.startAt) : "",
  );
  const [durationMinutes, setDurationMinutes] = useState(
    reservation ? String(reservation.durationMinutes) : "60",
  );
  const [status, setStatus] = useState<ReservationStatus>(
    reservation?.status ?? "confirmed",
  );
  const [pendingNote, setPendingNote] = useState(
    reservation?.pendingNote ?? "",
  );

  const create = useCreateReservation();
  const update = useUpdateReservation();
  const mutation = isEditing ? update : create;

  const customerOptions: ComboboxOption[] = (customers ?? []).map(
    (customer) => ({ value: customer.id, label: customer.name }),
  );

  // Reseta pro estado "de origem" (em branco ao criar, ou de volta aos
  // valores da reserva ao editar) — não só depois de salvar, mas em
  // qualquer fechamento (cancelar, Esc, clique fora). Sem isso, o diálogo
  // é reaproveitado entre aberturas (mesma `key` em modo criação) e campos
  // como "Tipo" ficavam com o valor da tentativa anterior.
  function resetForm() {
    setType(reservation?.type ?? "pc");
    setCustomerMode(reservation?.customerId ? "registered" : "guest");
    setCustomerId(reservation?.customerId ?? "");
    setGuestName(reservation?.guestName ?? "");
    setGuestPhone(reservation?.guestPhone ?? "");
    setStartAt(reservation ? toDatetimeLocalValue(reservation.startAt) : "");
    setDurationMinutes(
      reservation ? String(reservation.durationMinutes) : "60",
    );
    setStatus(reservation?.status ?? "confirmed");
    setPendingNote(reservation?.pendingNote ?? "");
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dto = {
      type,
      customerId: customerMode === "registered" ? customerId : undefined,
      guestName: customerMode === "guest" ? guestName : undefined,
      guestPhone: customerMode === "guest" ? guestPhone : undefined,
      startAt: new Date(startAt).toISOString(),
      durationMinutes: Number(durationMinutes),
      status,
      pendingNote: status === "pending" ? pendingNote : undefined,
    };

    if (isEditing && reservation) {
      update.mutate(
        { id: reservation.id, dto },
        { onSuccess: () => handleClose(false) },
      );
    } else {
      create.mutate(dto, { onSuccess: () => handleClose(false) });
    }
  }

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.isError
        ? "Não foi possível salvar."
        : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar reserva" : "Nova reserva"}
          </DialogTitle>
          <DialogDescription>
            Reserva de PC, console ou sala — a capacidade de cada tipo é
            controlada à parte.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="res-type">Tipo</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as ReservationType)}
            >
              <SelectTrigger id="res-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {RESERVATION_TYPE_LABEL[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="res-customer-mode">Quem está reservando</Label>
            <Select
              value={customerMode}
              onValueChange={(value) => setCustomerMode(value as CustomerMode)}
            >
              <SelectTrigger id="res-customer-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registered">Cliente cadastrado</SelectItem>
                <SelectItem value="guest">Visitante (sem cadastro)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {customerMode === "registered" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="res-customer">Cliente</Label>
              <Combobox
                value={customerId}
                onValueChange={setCustomerId}
                options={customerOptions}
                placeholder="Selecione um cliente"
                searchPlaceholder="Buscar cliente..."
                emptyText="Nenhum cliente encontrado."
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="res-guest-name">Nome</Label>
                <Input
                  id="res-guest-name"
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="res-guest-phone">Telefone</Label>
                <Input
                  id="res-guest-phone"
                  type="tel"
                  value={guestPhone}
                  onChange={(event) => setGuestPhone(event.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="res-start">Início</Label>
              <Input
                id="res-start"
                type="datetime-local"
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="res-duration">Duração (min)</Label>
              <Input
                id="res-duration"
                type="number"
                min={1}
                step={1}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="res-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as ReservationStatus)}
            >
              <SelectTrigger id="res-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {RESERVATION_STATUS_LABEL[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === "pending" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="res-pending-note">O que está pendente</Label>
              <Input
                id="res-pending-note"
                value={pendingNote}
                onChange={(event) => setPendingNote(event.target.value)}
                placeholder="Ex.: aguardando confirmação do cliente"
              />
            </div>
          )}

          {errorMessage && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
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
