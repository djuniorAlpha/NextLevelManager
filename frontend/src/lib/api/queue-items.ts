import { createAdminCrudApi } from "@/lib/api/admin-crud";
import type {
  CreateQueueItem,
  QueueItem,
  UpdateQueueItem,
} from "@/types/queue-item";

export const queueItemsApi = createAdminCrudApi<
  QueueItem,
  CreateQueueItem,
  UpdateQueueItem
>("/queue-items");
