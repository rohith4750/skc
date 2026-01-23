-- AlterTable
ALTER TABLE "bills" ADD COLUMN     "paymentHistory" JSONB;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "allocationMethod" TEXT,
ADD COLUMN     "bulkAllocations" JSONB,
ADD COLUMN     "isBulkExpense" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "transportCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "enquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "location" TEXT,
    "loginTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "failReason" TEXT,

    CONSTRAINT "login_audit_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "login_audit_logs" ADD CONSTRAINT "login_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
