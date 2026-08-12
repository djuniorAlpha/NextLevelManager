import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MachineStatusBadge } from "@/components/machines/machine-status-badge";
import { MachineActions } from "@/components/machines/machine-actions";
import { LastHeartbeat } from "@/components/machines/last-heartbeat";
import { MACHINE_TYPE_LABEL } from "@/lib/format";
import type { Machine } from "@/types/machine";

export function MachineCard({ machine }: { machine: Machine }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            #{machine.machineNumber}
          </span>
          <span
            title={machine.online ? "Online" : "Offline"}
            className={`size-2.5 rounded-full ${
              machine.online ? "animate-pulse bg-success" : "bg-muted-foreground/40"
            }`}
          />
        </div>
        <MachineStatusBadge status={machine.status} />
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <dt>Host</dt>
          <dd className="text-foreground">{machine.hostname}</dd>

          <dt>Tipo</dt>
          <dd className="text-foreground">
            {MACHINE_TYPE_LABEL[machine.type]}
            {machine.consoleModelId ? ` (${machine.consoleModelId})` : ""}
          </dd>

          <dt>IP</dt>
          <dd className="text-foreground">{machine.ipAddress}</dd>

          <dt>MAC</dt>
          <dd className="text-foreground">{machine.macAddress}</dd>

          <dt>Último sinal</dt>
          <dd className="text-foreground">
            <LastHeartbeat lastHeartbeatAt={machine.lastHeartbeatAt} />
          </dd>
        </dl>

        <MachineActions
          machineId={machine.id}
          machineNumber={machine.machineNumber}
        />
      </CardContent>
    </Card>
  );
}
