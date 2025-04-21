/*
  Warnings:

  - You are about to drop the column `createdAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `vote` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `incidentreport` DROP FOREIGN KEY `IncidentReport_userId_fkey`;

-- DropForeignKey
ALTER TABLE `vote` DROP FOREIGN KEY `Vote_reportId_fkey`;

-- DropForeignKey
ALTER TABLE `vote` DROP FOREIGN KEY `Vote_userId_fkey`;

-- DropIndex
DROP INDEX `IncidentReport_userId_fkey` ON `incidentreport`;

-- DropIndex
DROP INDEX `Vote_reportId_fkey` ON `vote`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `createdAt`,
    ALTER COLUMN `role` DROP DEFAULT;

-- AlterTable
ALTER TABLE `vote` DROP COLUMN `createdAt`;

-- CreateIndex
CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);

-- AddForeignKey
ALTER TABLE `IncidentReport` ADD CONSTRAINT `IncidentReport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `IncidentReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
