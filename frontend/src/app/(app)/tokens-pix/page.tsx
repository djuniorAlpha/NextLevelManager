import { AppSettingsCard } from "@/components/tokens/app-settings-card";
import { PixTokensSection } from "@/components/tokens/pix-tokens-section";

export default function TokensPixPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Tokens Pix</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AppSettingsCard />
        <PixTokensSection />
      </div>
    </div>
  );
}
