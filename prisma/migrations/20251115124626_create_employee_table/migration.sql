-- CreateTable
CREATE TABLE "Employee"
(
    "id"        SERIAL      NOT NULL,
    "name"      TEXT        NOT NULL,
    "email"     TEXT        NOT NULL,
    "position"  TEXT,
    "companyId" INTEGER     NOT NULL,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee" ("email");

-- AddForeignKey
ALTER TABLE "Employee"
    ADD CONSTRAINT "Employee_companyId_fkey"
        FOREIGN KEY ("companyId")
            REFERENCES "Company" ("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;