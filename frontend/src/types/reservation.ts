import type { Customer } from "@/types/customer";

export type ReservationType = "pc" | "console" | "room";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "canceled"
  | "completed";

export interface Reservation {
  id: string;
  type: ReservationType;
  customerId: string | null;
  customer: Customer | null;
  guestName: string | null;
  guestPhone: string | null;
  startAt: string;
  durationMinutes: number;
  endAt: string;
  status: ReservationStatus;
  pendingNote: string | null;
  createdAt: string;
}

export interface CreateReservation {
  type: ReservationType;
  customerId?: string;
  guestName?: string;
  guestPhone?: string;
  startAt: string;
  durationMinutes: number;
  status?: ReservationStatus;
  pendingNote?: string;
}

export type UpdateReservation = Partial<CreateReservation>;
