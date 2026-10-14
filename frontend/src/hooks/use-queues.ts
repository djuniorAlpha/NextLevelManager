import { createAdminCrudHooks } from "@/hooks/use-admin-crud";
import { queuesApi } from "@/lib/api/queues";
import type { CreateQueue, Queue, UpdateQueue } from "@/types/queue";

const hooks = createAdminCrudHooks<Queue, CreateQueue, UpdateQueue>(
  "queues",
  queuesApi,
);

export const useQueues = hooks.useList;
export const useCreateQueue = hooks.useCreate;
export const useUpdateQueue = hooks.useUpdate;
export const useRemoveQueue = hooks.useRemove;
