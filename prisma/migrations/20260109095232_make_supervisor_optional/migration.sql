-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_supervisorId_fkey";

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "supervisorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "supervisors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
