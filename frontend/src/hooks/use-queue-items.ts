import { createAdminCrudHooks } from "@/hooks/use-admin-crud";
import { queueItemsApi } from "@/lib/api/queue-items";
import type {
  CreateQueueItem,
  QueueItem,
  UpdateQueueItem,
} from "@/types/queue-item";

const hooks = createAdminCrudHooks<QueueItem, CreateQueueItem, UpdateQueueItem>(
  "queueItems",
  queueItemsApi,
);

export const useQueueItems = hooks.useList;
export const useCreateQueueItem = hooks.useCreate;
export const useUpdateQueueItem = hooks.useUpdate;
export const useRemoveQueueItem = hooks.useRemove;
