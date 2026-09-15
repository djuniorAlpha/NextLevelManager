import type { Machine } from "@/types/machine";

export interface QueueItem {
  id: string;
  queueId: string;
  order: number;
  username: string;
  machineId: string | null;
  machine: Machine | null;
}

export interface CreateQueueItem {
  queueId: string;
  username: string;
  order: number;
  machineId?: string;
}

export type UpdateQueueItem = Partial<Omit<CreateQueueItem, "queueId">>;
