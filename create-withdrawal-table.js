const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function createWithdrawalTable() {
  try {
    

    // Create enum
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'COMPLETED', 'FAILED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`);
    

    // Create WithdrawalRequest table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WithdrawalRequest" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "walletId" TEXT NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
        "payoutDetailsId" TEXT,
        "processedAt" TIMESTAMP(3),
        "processedBy" TEXT,
        "rejectionReason" TEXT,
        "transactionId" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
      )
    `);
    

    // Create indexes
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "WithdrawalRequest_userId_idx" ON "WithdrawalRequest"("userId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "WithdrawalRequest_walletId_idx" ON "WithdrawalRequest"("walletId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "WithdrawalRequest_status_idx" ON "WithdrawalRequest"("status")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "WithdrawalRequest_createdAt_idx" ON "WithdrawalRequest"("createdAt")`);
    

    // Create foreign keys
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "WithdrawalRequest" 
        ADD CONSTRAINT "WithdrawalRequest_userId_fkey" 
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
        ALTER TABLE "WithdrawalRequest" 
        ADD CONSTRAINT "WithdrawalRequest_walletId_fkey" 
        FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
      
    } catch (err) {
      if (err.code === 'P0001' || err.message?.includes('already exists')) {
        
      } else {
        throw err;
      }
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "WithdrawalRequest" 
        ADD CONSTRAINT "WithdrawalRequest_payoutDetailsId_fkey" 
        FOREIGN KEY ("payoutDetailsId") REFERENCES "PayoutDetails"("id") ON DELETE SET NULL ON UPDATE CASCADE
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

createWithdrawalTable();
