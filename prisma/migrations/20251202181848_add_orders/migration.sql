-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Order"
(
    "id"          SERIAL        NOT NULL,
    "title"       TEXT          NOT NULL,
    "description" TEXT,
    "status"      "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "companyId"   INTEGER       NOT NULL,
    "createdById" INTEGER       NOT NULL,
    "createdAt"   timestamptz  NOT NULL DEFAULT now(),
    "updatedAt"   timestamptz  NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Order"
    ADD CONSTRAINT "Order_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order"
    ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
