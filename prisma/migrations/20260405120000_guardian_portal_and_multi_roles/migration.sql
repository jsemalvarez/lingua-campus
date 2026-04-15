-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SECRETARY';
ALTER TYPE "UserRole" ADD VALUE 'GUARDIAN';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "roles" "UserRole"[] DEFAULT ARRAY['ADMIN']::"UserRole"[];
ALTER TABLE "User" ADD COLUMN "dni" TEXT;

-- Update roles with existing role data (Data Migration)
UPDATE "User" SET "roles" = ARRAY["role"]::"UserRole"[];

-- CreateTable
CREATE TABLE "GuardianStudentLink" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "relation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuardianStudentLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_dni_key" ON "User"("dni");
CREATE UNIQUE INDEX "GuardianStudentLink_guardianId_studentId_key" ON "GuardianStudentLink"("guardianId", "studentId");

-- AddForeignKey
ALTER TABLE "GuardianStudentLink" ADD CONSTRAINT "GuardianStudentLink_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GuardianStudentLink" ADD CONSTRAINT "GuardianStudentLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
