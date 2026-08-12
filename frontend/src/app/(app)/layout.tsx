"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/providers/auth-provider";
import { useRealtimeMachines } from "@/hooks/use-realtime-machines";

function AppShell({ children }: { children: React.ReactNode }) {
  const { admin, token, logout } = useAuth();
  useRealtimeMachines(token);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-4 border-b p-4">
        <span className="font-semibold">Next Level Manager</span>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {admin?.name}{" "}
            <span className="text-xs">
              ({admin?.role === "owner" ? "proprietário" : "atendente"})
            </span>
          </span>
          <Separator orientation="vertical" className="h-4" />
          <Button variant="ghost" size="sm" onClick={logout}>
            Sair
          </Button>
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
