const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function createCodTables() {
  try {
    

    // Create enums
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "CodCollectionMethod" AS ENUM ('MANUAL', 'AUTO_DEBIT');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`);
    

    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "CodCollectionStatus" AS ENUM ('COLLECTED', 'REMITTED', 'PARTIALLY_REMITTED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`);
    

    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "RemittanceMethod" AS ENUM ('MANUAL', 'RAZORPAY', 'AUTO_DEBIT');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`);
    

    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "RemittanceStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`);
    

    // Create CodCollection table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CodCollection" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "bookingId" TEXT NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "collectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "collectedBy" TEXT,
        "collectionMethod" "CodCollectionMethod" NOT NULL,
        "status" "CodCollectionStatus" NOT NULL DEFAULT 'COLLECTED',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "CodCollection_pkey" PRIMARY KEY ("id")
      )
    `);
    

    // Create indexes for CodCollection
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CodCollection_userId_idx" ON "CodCollection"("userId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CodCollection_bookingId_idx" ON "CodCollection"("bookingId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CodCollection_status_idx" ON "CodCollection"("status")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CodCollection_collectionDate_idx" ON "CodCollection"("collectionDate")`);
    

    // Create foreign keys for CodCollection
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "CodCollection" 
        ADD CONSTRAINT "CodCollection_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
      
    } catch (err) {
      if (err.code === 'P0001' || err.message?.includes('already exists')) {
        
      } else {
        throw err;
      }
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "CodCollection" 
        ADD CONSTRAINT "CodCollection_bookingId_fkey" 
        FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
      
    } catch (err) {
      if (err.code === 'P0001' || err.message?.includes('already exists')) {
        
      } else {
        throw err;
      }
    }

    // Create CodRemittance table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CodRemittance" (
        "id" TEXT NOT NULL,
        "collectionId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "remittanceMethod" "RemittanceMethod" NOT NULL,
        "remittanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "transactionId" TEXT,
        "status" "RemittanceStatus" NOT NULL DEFAULT 'PENDING',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "CodRemittance_pkey" PRIMARY KEY ("id")
      )
    `);
    

    // Create indexes for CodRemittance
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CodRemittance_collectionId_idx" ON "CodRemittance"("collectionId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CodRemittance_userId_idx" ON "CodRemittance"("userId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CodRemittance_status_idx" ON "CodRemittance"("status")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CodRemittance_remittanceDate_idx" ON "CodRemittance"("remittanceDate")`);
    

    // Create foreign keys for CodRemittance
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "CodRemittance" 
        ADD CONSTRAINT "CodRemittance_collectionId_fkey" 
        FOREIGN KEY ("collectionId") REFERENCES "CodCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
      
    } catch (err) {
      if (err.code === 'P0001' || err.message?.includes('already exists')) {
        
      } else {
        throw err;
      }
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "CodRemittance" 
        ADD CONSTRAINT "CodRemittance_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
      
    } catch (err) {
      if (err.code === 'P0001' || err.message?.includes('already exists')) {
        
      } else {
        throw err;
      }
    }

    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCodTables();
