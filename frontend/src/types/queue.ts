import type { QueueItem } from "@/types/queue-item";

export interface Queue {
  id: string;
  name: string;
  createdAt: string;
  items: QueueItem[];
}

export interface CreateQueue {
  name: string;
}

export type UpdateQueue = Partial<CreateQueue>;
