-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "isLate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lateMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scheduledClockIn" TIMESTAMP(3),
ADD COLUMN     "scheduledClockOut" TIMESTAMP(3),
ADD COLUMN     "shiftType" TEXT;
