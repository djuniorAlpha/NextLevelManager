import { Badge } from "@/components/ui/badge";
import { MACHINE_STATUS_BADGE_CLASS, MACHINE_STATUS_LABEL } from "@/lib/format";
import type { MachineStatus } from "@/types/machine";

export function MachineStatusBadge({ status }: { status: MachineStatus }) {
  return (
    <Badge className={MACHINE_STATUS_BADGE_CLASS[status]}>
      {MACHINE_STATUS_LABEL[status]}
    </Badge>
  );
}
