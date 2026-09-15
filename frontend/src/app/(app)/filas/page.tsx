import { QueueSection } from "@/components/queue/queue-section";

export default function FilasPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Filas</h1>
      <QueueSection />
    </div>
  );
}
