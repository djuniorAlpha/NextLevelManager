import { createAdminCrudApi } from "@/lib/api/admin-crud";
import type { CreateQueue, Queue, UpdateQueue } from "@/types/queue";

export const queuesApi = createAdminCrudApi<Queue, CreateQueue, UpdateQueue>(
  "/queues",
);
