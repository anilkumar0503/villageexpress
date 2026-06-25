const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function createPayoutTable() {
  try {
    

    // Create enum type
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "PayoutMethod" AS ENUM ('UPI', 'BANK_TRANSFER');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`);
    

    // Create table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PayoutDetails" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "type" "PayoutMethod" NOT NULL,
        "upiId" TEXT,
        "bankName" TEXT,
        "accountNumber" TEXT,
        "ifscCode" TEXT,
        "accountHolderName" TEXT,
        "isDefault" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "PayoutDetails_pkey" PRIMARY KEY ("id")
      )
    `);
    

    // Create indexes
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "PayoutDetails_userId_key" ON "PayoutDetails"("userId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PayoutDetails_userId_idx" ON "PayoutDetails"("userId")`);
    

    // Add foreign key (without IF NOT EXISTS as it's not supported)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "PayoutDetails" 
        ADD CONSTRAINT "PayoutDetails_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
      
    } catch (err) {
      // Constraint might already exist
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

createPayoutTable();
