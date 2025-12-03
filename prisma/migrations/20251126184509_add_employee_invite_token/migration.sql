-- AlterTable
ALTER TABLE "Employee"
    ADD COLUMN "inviteToken" TEXT,
ADD COLUMN     "inviteTokenExpires" timestamptz,
ALTER
COLUMN "passwordHash" DROP
NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Employee_inviteToken_key" ON "Employee" ("inviteToken");
