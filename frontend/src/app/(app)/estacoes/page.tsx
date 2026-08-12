import { MachineGrid } from "@/components/machines/machine-grid";

export default function EstacoesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Mapa de Estações</h1>
      <MachineGrid />
    </div>
  );
}
