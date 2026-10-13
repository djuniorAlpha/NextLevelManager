import { createAdminCrudHooks } from "@/hooks/use-admin-crud";
import { reservationsApi } from "@/lib/api/reservations";
import type {
  CreateReservation,
  Reservation,
  UpdateReservation,
} from "@/types/reservation";

const hooks = createAdminCrudHooks<
  Reservation,
  CreateReservation,
  UpdateReservation
>("reservations", reservationsApi);

export const useReservations = hooks.useList;
export const useCreateReservation = hooks.useCreate;
export const useUpdateReservation = hooks.useUpdate;
export const useRemoveReservation = hooks.useRemove;
