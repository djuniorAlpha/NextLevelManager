"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, LogOut, Monitor, Users } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/providers/auth-provider";
import { useRealtimeMachines } from "@/hooks/use-realtime-machines";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/estacoes", label: "Estações", icon: Monitor },
  { href: "/cobranca-pc", label: "Cobrança PC", icon: CreditCard },
  { href: "/clientes", label: "Clientes", icon: Users },
];

function AppShell({ children }: { children: React.ReactNode }) {
  const { admin, token, logout } = useAuth();
  const pathname = usePathname();
  useRealtimeMachines(token);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-4 border-b p-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="flex items-center gap-4 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 text-muted-foreground hover:text-foreground",
                  pathname === link.href && "font-medium text-brand",
                )}
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {admin?.name}{" "}
            <span className="text-xs">
              ({admin?.role === "owner" ? "proprietário" : "atendente"})
            </span>
          </span>
          <Separator orientation="vertical" className="h-4" />
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut data-icon="inline-start" />
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
