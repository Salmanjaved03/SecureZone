/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `user` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `User_username_key` ON `user`;

-- AlterTable
ALTER TABLE `incidentreport` ADD COLUMN `isFlagged` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `updatedAt`,
    ADD COLUMN `isBanned` BOOLEAN NOT NULL DEFAULT false;
