-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'pending';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "CustomerSubscription" ALTER COLUMN "mercadoPagoPreapprovalId" DROP NOT NULL,
ALTER COLUMN "currentPeriodStart" DROP NOT NULL,
ALTER COLUMN "currentPeriodEnd" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "maxActiveSubscribers" INTEGER,
ADD COLUMN     "mercadoPagoPreapprovalPlanId" TEXT,
ADD COLUMN     "pdvDiscountPercent" INTEGER,
ADD COLUMN     "perks" TEXT[];
