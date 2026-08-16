-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "tokenId" TEXT;

-- CreateTable
CREATE TABLE "PixToken" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "totalSeconds" INTEGER NOT NULL,
    "remainingSeconds" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PixToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "pixTokenValidityDays" INTEGER NOT NULL DEFAULT 7,
    "pixTokenMinRemainingMinutes" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PixToken_code_key" ON "PixToken"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PixToken_paymentId_key" ON "PixToken"("paymentId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "PixToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PixToken" ADD CONSTRAINT "PixToken_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
