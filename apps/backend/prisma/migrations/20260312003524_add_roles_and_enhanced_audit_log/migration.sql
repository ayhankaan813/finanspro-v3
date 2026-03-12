/*
  Warnings:

  - You are about to drop the column `new_data` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `old_data` on the `audit_logs` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'OPERATOR';
ALTER TYPE "UserRole" ADD VALUE 'PARTNER';
ALTER TYPE "UserRole" ADD VALUE 'VIEWER';

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "new_data",
DROP COLUMN "old_data",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "duration_ms" INTEGER,
ADD COLUMN     "fingerprint" TEXT,
ADD COLUMN     "new_values" JSONB,
ADD COLUMN     "old_values" JSONB,
ADD COLUMN     "request_method" TEXT,
ADD COLUMN     "request_path" TEXT,
ADD COLUMN     "session_id" TEXT,
ADD COLUMN     "status_code" INTEGER,
ADD COLUMN     "user_agent" TEXT,
ADD COLUMN     "user_role" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "allowed_sites" JSONB,
ADD COLUMN     "partner_id" TEXT;

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_ip_address_idx" ON "audit_logs"("ip_address");

-- CreateIndex
CREATE INDEX "users_partner_id_idx" ON "users"("partner_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
