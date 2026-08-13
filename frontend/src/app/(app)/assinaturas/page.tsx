import { PlansSection } from "@/components/subscriptions/plans-section";
import { SubscribersSection } from "@/components/subscriptions/subscribers-section";

export default function AssinaturasPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Assinaturas</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlansSection />
        <SubscribersSection />
      </div>
    </div>
  );
}
