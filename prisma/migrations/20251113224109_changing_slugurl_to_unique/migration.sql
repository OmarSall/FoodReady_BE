-- AlterTable
UPDATE "Company"
SET "slugUrl" = LOWER("id" || REPLACE("name", ' ', '-'));