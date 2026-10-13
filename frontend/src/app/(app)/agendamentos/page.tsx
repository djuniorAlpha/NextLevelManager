import { ReservationsSection } from "@/components/reservations/reservations-section";

export default function AgendamentosPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Agendamentos</h1>
      <ReservationsSection />
    </div>
  );
}
