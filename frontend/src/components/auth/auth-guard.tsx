"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";

function subscribeNever() {
  return () => {};
}
function getHydratedSnapshot() {
  return true;
}
function getServerHydratedSnapshot() {
  return false;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // isAuthenticated nasce `false` no SSR (localStorage não existe lá) e só é
  // corrigido depois da hidratação. Sem essa flag, um reload numa rota
  // autenticada dispara o redirect pro /login antes desse valor ser
  // corrigido — o usuário vê um bounce indevido.
  const hydrated = useSyncExternalStore(
    subscribeNever,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, isAuthenticated, pathname, router]);

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return <>{children}</>;
}
