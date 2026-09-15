"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { useAuth } from "@/components/providers/auth-provider";
import { Logo } from "@/components/logo";

function LoginPageContent() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(searchParams.get("next") || "/estacoes");
    }
  }, [isAuthenticated, router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Logo
            subtitle
            ring
            markClassName="size-16"
            className="mb-2 flex-col text-center"
          />
          <CardDescription>
            Entre com sua conta de administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
