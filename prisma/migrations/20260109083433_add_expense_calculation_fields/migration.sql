-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "calculationDetails" JSONB,
ADD COLUMN     "eventDate" TIMESTAMP(3);
