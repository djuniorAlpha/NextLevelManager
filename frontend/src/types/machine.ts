export type MachineType = "pc" | "console_tv";

export type MachineStatus =
  | "locked"
  | "time_selection"
  | "waiting_pix"
  | "active"
  | "offline";

export interface Machine {
  id: string;
  machineNumber: number;
  type: MachineType;
  consoleModelId: string | null;
  macAddress: string;
  hostname: string;
  ipAddress: string;
  apiKey: string;
  status: MachineStatus;
  lastHeartbeatAt: string | null;
  createdAt: string;
  online: boolean;
}

export type ForceAction = "lock" | "unlock" | "shutdown";
