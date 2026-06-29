/*
  Warnings:

  - A unique constraint covering the columns `[companyCode]` on the table `manufacturer` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `auditlog` DROP FOREIGN KEY `auditlog_batchId_fkey`;

-- DropForeignKey
ALTER TABLE `batch` DROP FOREIGN KEY `batch_medicineId_fkey`;

-- DropForeignKey
ALTER TABLE `document_audit_log` DROP FOREIGN KEY `document_audit_log_documentId_fkey`;

-- DropForeignKey
ALTER TABLE `manufacturer` DROP FOREIGN KEY `manufacturer_userId_fkey`;

-- DropForeignKey
ALTER TABLE `manufacturer_document` DROP FOREIGN KEY `manufacturer_document_manufacturerId_fkey`;

-- DropForeignKey
ALTER TABLE `medicine` DROP FOREIGN KEY `medicine_manufacturerId_fkey`;

-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `notification_userId_fkey`;

-- DropForeignKey
ALTER TABLE `pharmacy` DROP FOREIGN KEY `pharmacy_userId_fkey`;

-- DropForeignKey
ALTER TABLE `pill` DROP FOREIGN KEY `pill_batchId_fkey`;

-- DropForeignKey
ALTER TABLE `qrasset` DROP FOREIGN KEY `qrasset_batchId_fkey`;

-- DropForeignKey
ALTER TABLE `report` DROP FOREIGN KEY `report_userId_fkey`;

-- DropForeignKey
ALTER TABLE `session` DROP FOREIGN KEY `session_userId_fkey`;

-- DropForeignKey
ALTER TABLE `verificationlog` DROP FOREIGN KEY `verificationlog_pillId_fkey`;

-- DropForeignKey
ALTER TABLE `verificationlog` DROP FOREIGN KEY `verificationlog_userId_fkey`;

-- AlterTable
ALTER TABLE `batch` ADD COLUMN `boxesPerCarton` INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE `manufacturer` ADD COLUMN `companyCode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `medicine` ADD COLUMN `activeIngredients` TEXT NULL,
    ADD COLUMN `approvalDate` DATETIME(3) NULL,
    ADD COLUMN `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'REGISTERED',
    ADD COLUMN `drapRegNumber` VARCHAR(191) NULL,
    ADD COLUMN `isPublicDRAPEntry` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `manufacturer_name` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `pill` ADD COLUMN `boxId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `passwordResetExpiry` DATETIME(3) NULL,
    ADD COLUMN `passwordResetToken` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `export_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `manufacturerId` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `exportType` VARCHAR(191) NOT NULL,
    `exportedBy` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `export_analytics_manufacturerId_idx`(`manufacturerId`),
    INDEX `export_analytics_batchId_idx`(`batchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batch_sequence` (
    `id` VARCHAR(191) NOT NULL,
    `medicineId` VARCHAR(191) NOT NULL,
    `prefix` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `minSequence` INTEGER NOT NULL,
    `maxSequence` INTEGER NOT NULL,
    `totalBatches` INTEGER NOT NULL,
    `confidence` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `batch_sequence_prefix_year_idx`(`prefix`, `year`),
    UNIQUE INDEX `batch_sequence_medicineId_prefix_year_key`(`medicineId`, `prefix`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drap_recall` (
    `id` VARCHAR(191) NOT NULL,
    `medicineName` VARCHAR(191) NOT NULL,
    `batchNumber` VARCHAR(191) NULL,
    `recallDate` DATETIME(3) NOT NULL,
    `reason` TEXT NOT NULL,
    `severity` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `drapRef` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `drap_recall_medicineName_idx`(`medicineName`),
    INDEX `drap_recall_batchNumber_idx`(`batchNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carton` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `cartonNumber` VARCHAR(191) NOT NULL,
    `qrCode` VARCHAR(191) NOT NULL,
    `boxesCount` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `scannedAt` DATETIME(3) NULL,
    `scannedLocation` VARCHAR(191) NULL,
    `scannedByUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `carton_cartonNumber_key`(`cartonNumber`),
    UNIQUE INDEX `carton_qrCode_key`(`qrCode`),
    INDEX `carton_batchId_idx`(`batchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `box` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `cartonId` VARCHAR(191) NULL,
    `boxNumber` VARCHAR(191) NOT NULL,
    `qrCode` VARCHAR(191) NOT NULL,
    `pillsCount` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `pharmacyScannedAt` DATETIME(3) NULL,
    `pharmacyId` VARCHAR(191) NULL,
    `patientScannedAt` DATETIME(3) NULL,
    `patientUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `box_boxNumber_key`(`boxNumber`),
    UNIQUE INDEX `box_qrCode_key`(`qrCode`),
    INDEX `box_batchId_idx`(`batchId`),
    INDEX `box_cartonId_idx`(`cartonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `manufacturer_companyCode_key` ON `manufacturer`(`companyCode`);

-- CreateIndex
CREATE INDEX `pill_boxId_idx` ON `pill`(`boxId`);
