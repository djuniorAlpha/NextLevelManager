"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSettings, useUpdateAppSettings } from "@/hooks/use-app-settings";
import { ApiError } from "@/lib/api/client";
import type { AppSetting } from "@/types/pix-token";

function AppSettingsForm({ settings }: { settings: AppSetting }) {
  const [validityDays, setValidityDays] = useState(
    String(settings.pixTokenValidityDays),
  );
  const [minRemainingMinutes, setMinRemainingMinutes] = useState(
    String(settings.pixTokenMinRemainingMinutes),
  );

  const update = useUpdateAppSettings();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update.mutate({
      pixTokenValidityDays: Number(validityDays),
      pixTokenMinRemainingMinutes: Number(minRemainingMinutes),
    });
  }

  const errorMessage =
    update.error instanceof ApiError
      ? update.error.message
      : update.isError
        ? "Não foi possível salvar."
        : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="setting-validity-days">
          Validade do token Pix (dias)
        </Label>
        <Input
          id="setting-validity-days"
          type="number"
          min={1}
          step={1}
          value={validityDays}
          onChange={(event) => setValidityDays(event.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="setting-min-remaining">
          Tempo mínimo restante pra aceitar o resgate (minutos)
        </Label>
        <Input
          id="setting-min-remaining"
          type="number"
          min={0}
          step={1}
          value={minRemainingMinutes}
          onChange={(event) => setMinRemainingMinutes(event.target.value)}
          required
        />
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={update.isPending} className="self-start">
        {update.isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}

export function AppSettingsCard() {
  const { data, isLoading, isError, refetch } = useAppSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de token</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-32 w-full" />}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar as configurações.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!isLoading && !isError && data && (
          <AppSettingsForm key={JSON.stringify(data)} settings={data} />
        )}
      </CardContent>
    </Card>
  );
}
