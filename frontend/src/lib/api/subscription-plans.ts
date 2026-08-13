import { createAdminCrudApi } from "@/lib/api/admin-crud";
import type {
  CreateSubscriptionPlanDto,
  SubscriptionPlan,
  UpdateSubscriptionPlanDto,
} from "@/types/subscription";

export const subscriptionPlansApi = createAdminCrudApi<
  SubscriptionPlan,
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto
>("/subscription-plans");
