-- CreateEnum
CREATE TYPE "PendingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "pending_transactions" (
    "id" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "description" TEXT,
    "requested_by" TEXT NOT NULL,
    "requester_role" TEXT NOT NULL,
    "status" "PendingStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "result_transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_transactions_status_created_at_idx" ON "pending_transactions"("status", "created_at");

-- CreateIndex
CREATE INDEX "pending_transactions_requested_by_idx" ON "pending_transactions"("requested_by");

-- CreateIndex
CREATE INDEX "pending_transactions_transaction_type_idx" ON "pending_transactions"("transaction_type");

-- AddForeignKey
ALTER TABLE "pending_transactions" ADD CONSTRAINT "pending_transactions_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_transactions" ADD CONSTRAINT "pending_transactions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
