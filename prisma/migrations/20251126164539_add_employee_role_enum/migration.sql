-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('OWNER', 'EMPLOYEE');

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "position",
ADD COLUMN     "position" "EmployeeRole" NOT NULL;
