-- AlterTable
ALTER TABLE `incidentreport` ADD COLUMN `downvotes` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `upvotes` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `Vote` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `voteType` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Vote_userId_reportId_key`(`userId`, `reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `IncidentReport`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
