-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID');

-- CreateEnum
CREATE TYPE "CommissionRole" AS ENUM ('CAPTAIN', 'POINT_MANAGER');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "vehicleType" "VehicleType";

-- AlterTable
ALTER TABLE "BookingSegment" ADD COLUMN     "vehicleType" "VehicleType";

-- AlterTable
ALTER TABLE "RoutePricingRule" ADD COLUMN     "vehicleType" "VehicleType";

-- CreateTable
CREATE TABLE "RouteCommissionRule" (
    "id" TEXT NOT NULL,
    "routeSegmentId" TEXT NOT NULL,
    "vehicleType" "VehicleType",
    "captainCommissionPct" DECIMAL(65,30) NOT NULL DEFAULT 10,
    "pmCommissionPct" DECIMAL(65,30) NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteCommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingSegmentId" TEXT NOT NULL,
    "role" "CommissionRole" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RouteCommissionRule_routeSegmentId_idx" ON "RouteCommissionRule"("routeSegmentId");

-- CreateIndex
CREATE INDEX "RouteCommissionRule_vehicleType_idx" ON "RouteCommissionRule"("vehicleType");

-- CreateIndex
CREATE UNIQUE INDEX "RouteCommissionRule_routeSegmentId_vehicleType_key" ON "RouteCommissionRule"("routeSegmentId", "vehicleType");

-- CreateIndex
CREATE INDEX "CommissionLedger_userId_idx" ON "CommissionLedger"("userId");

-- CreateIndex
CREATE INDEX "CommissionLedger_bookingSegmentId_idx" ON "CommissionLedger"("bookingSegmentId");

-- CreateIndex
CREATE INDEX "CommissionLedger_status_idx" ON "CommissionLedger"("status");

-- CreateIndex
CREATE INDEX "CommissionLedger_role_idx" ON "CommissionLedger"("role");

-- CreateIndex
CREATE INDEX "RoutePricingRule_vehicleType_idx" ON "RoutePricingRule"("vehicleType");

-- AddForeignKey
ALTER TABLE "RouteCommissionRule" ADD CONSTRAINT "RouteCommissionRule_routeSegmentId_fkey" FOREIGN KEY ("routeSegmentId") REFERENCES "RouteSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionLedger" ADD CONSTRAINT "CommissionLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionLedger" ADD CONSTRAINT "CommissionLedger_bookingSegmentId_fkey" FOREIGN KEY ("bookingSegmentId") REFERENCES "BookingSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
