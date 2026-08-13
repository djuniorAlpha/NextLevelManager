import { createAdminCrudHooks } from "@/hooks/use-admin-crud";
import { subscriptionPlansApi } from "@/lib/api/subscription-plans";
import type {
  CreateSubscriptionPlanDto,
  SubscriptionPlan,
  UpdateSubscriptionPlanDto,
} from "@/types/subscription";

const hooks = createAdminCrudHooks<
  SubscriptionPlan,
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto
>("subscription-plans", subscriptionPlansApi);

export const useSubscriptionPlans = hooks.useList;
export const useCreateSubscriptionPlan = hooks.useCreate;
export const useUpdateSubscriptionPlan = hooks.useUpdate;
export const useRemoveSubscriptionPlan = hooks.useRemove;
