-- CreateEnum
CREATE TYPE "BookingSegmentStatus" AS ENUM ('PENDING', 'RECEIVED_AT_POINT', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'HANDED_OFF', 'DELIVERED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "routeId" TEXT;

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceLocationId" TEXT NOT NULL,
    "destinationLocationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "estimatedDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteSegment" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "fromLocationId" TEXT NOT NULL,
    "toLocationId" TEXT NOT NULL,
    "distanceKm" DECIMAL(65,30) NOT NULL,
    "estimatedHours" INTEGER NOT NULL,

    CONSTRAINT "RouteSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingSegment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "routeSegmentId" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "status" "BookingSegmentStatus" NOT NULL DEFAULT 'PENDING',
    "assignedPointManagerId" TEXT,
    "assignedCaptainId" TEXT,
    "handedOffAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutePricingRule" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "minWeight" DECIMAL(65,30) NOT NULL,
    "maxWeight" DECIMAL(65,30) NOT NULL,
    "basePrice" DECIMAL(65,30) NOT NULL,
    "pricePerKm" DECIMAL(65,30) NOT NULL,
    "priority" "DeliveryPriority" NOT NULL DEFAULT 'STANDARD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutePricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Route_sourceLocationId_idx" ON "Route"("sourceLocationId");

-- CreateIndex
CREATE INDEX "Route_destinationLocationId_idx" ON "Route"("destinationLocationId");

-- CreateIndex
CREATE INDEX "Route_isActive_idx" ON "Route"("isActive");

-- CreateIndex
CREATE INDEX "RouteSegment_routeId_idx" ON "RouteSegment"("routeId");

-- CreateIndex
CREATE INDEX "RouteSegment_fromLocationId_idx" ON "RouteSegment"("fromLocationId");

-- CreateIndex
CREATE INDEX "RouteSegment_toLocationId_idx" ON "RouteSegment"("toLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "RouteSegment_routeId_sequenceOrder_key" ON "RouteSegment"("routeId", "sequenceOrder");

-- CreateIndex
CREATE INDEX "BookingSegment_bookingId_idx" ON "BookingSegment"("bookingId");

-- CreateIndex
CREATE INDEX "BookingSegment_routeSegmentId_idx" ON "BookingSegment"("routeSegmentId");

-- CreateIndex
CREATE INDEX "BookingSegment_assignedPointManagerId_idx" ON "BookingSegment"("assignedPointManagerId");

-- CreateIndex
CREATE INDEX "BookingSegment_assignedCaptainId_idx" ON "BookingSegment"("assignedCaptainId");

-- CreateIndex
CREATE INDEX "BookingSegment_status_idx" ON "BookingSegment"("status");

-- CreateIndex
CREATE INDEX "RoutePricingRule_routeId_idx" ON "RoutePricingRule"("routeId");

-- CreateIndex
CREATE INDEX "RoutePricingRule_priority_idx" ON "RoutePricingRule"("priority");

-- CreateIndex
CREATE INDEX "RoutePricingRule_isActive_idx" ON "RoutePricingRule"("isActive");

-- CreateIndex
CREATE INDEX "Booking_routeId_idx" ON "Booking"("routeId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_sourceLocationId_fkey" FOREIGN KEY ("sourceLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_destinationLocationId_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteSegment" ADD CONSTRAINT "RouteSegment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteSegment" ADD CONSTRAINT "RouteSegment_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteSegment" ADD CONSTRAINT "RouteSegment_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSegment" ADD CONSTRAINT "BookingSegment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSegment" ADD CONSTRAINT "BookingSegment_routeSegmentId_fkey" FOREIGN KEY ("routeSegmentId") REFERENCES "RouteSegment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSegment" ADD CONSTRAINT "BookingSegment_assignedPointManagerId_fkey" FOREIGN KEY ("assignedPointManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSegment" ADD CONSTRAINT "BookingSegment_assignedCaptainId_fkey" FOREIGN KEY ("assignedCaptainId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutePricingRule" ADD CONSTRAINT "RoutePricingRule_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
