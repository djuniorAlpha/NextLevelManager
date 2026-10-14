import { createAdminCrudApi } from "@/lib/api/admin-crud";
import type {
  CreateReservation,
  Reservation,
  UpdateReservation,
} from "@/types/reservation";

export const reservationsApi = createAdminCrudApi<
  Reservation,
  CreateReservation,
  UpdateReservation
>("/reservations");
