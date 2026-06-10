/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `batch` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `manufacturer` ADD COLUMN `businessEmail` VARCHAR(191) NULL,
    ADD COLUMN `businessLocation` VARCHAR(191) NULL,
    ADD COLUMN `businessPhone` VARCHAR(191) NULL,
    ADD COLUMN `certifications` TEXT NULL,
    ADD COLUMN `companyDescription` TEXT NULL,
    ADD COLUMN `companyLogo` TEXT NULL,
    ADD COLUMN `industryType` VARCHAR(191) NULL,
    ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `manufacturingCapacity` VARCHAR(191) NULL,
    ADD COLUMN `operatingCountries` TEXT NULL,
    ADD COLUMN `productCategories` TEXT NULL,
    ADD COLUMN `registrationDate` DATETIME(3) NULL,
    ADD COLUMN `registrationNumber` VARCHAR(191) NULL,
    ADD COLUMN `taxId` VARCHAR(191) NULL,
    ADD COLUMN `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'UNREGISTERED',
    ADD COLUMN `verifiedAt` DATETIME(3) NULL,
    ADD COLUMN `website` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `medicine` ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `dosage` VARCHAR(191) NULL,
    ADD COLUMN `genericName` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `pill` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `qrScanned` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `serialNumber` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `googleId` VARCHAR(191) NULL,
    ADD COLUMN `otpCode` VARCHAR(191) NULL,
    ADD COLUMN `otpExpiresAt` DATETIME(3) NULL,
    MODIFY `passwordHash` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `manufacturer_document` (
    `id` VARCHAR(191) NOT NULL,
    `manufacturerId` VARCHAR(191) NOT NULL,
    `documentType` ENUM('DRAP_LICENSE', 'WHO_GMP', 'ISO_CERTIFICATE', 'BUSINESS_REGISTRATION', 'TAX_REGISTRATION', 'MANUFACTURING_PERMIT', 'PRODUCT_QUALITY', 'ADDITIONAL') NOT NULL,
    `documentName` VARCHAR(191) NOT NULL,
    `documentUrl` TEXT NOT NULL,
    `fileSize` INTEGER NULL,
    `mimeType` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `verifiedAt` DATETIME(3) NULL,
    `verifiedBy` VARCHAR(191) NULL,
    `expiryDate` DATETIME(3) NULL,
    `remarks` TEXT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `manufacturer_document_manufacturerId_idx`(`manufacturerId`),
    INDEX `manufacturer_document_status_idx`(`status`),
    INDEX `manufacturer_document_documentType_idx`(`documentType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_audit_log` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `manufacturerId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `oldStatus` ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED') NULL,
    `newStatus` ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED') NULL,
    `performedBy` VARCHAR(191) NOT NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `document_audit_log_documentId_idx`(`documentId`),
    INDEX `document_audit_log_manufacturerId_idx`(`manufacturerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qrasset` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `fileUrl` TEXT NOT NULL,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `qrasset_batchId_idx`(`batchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditlog` (
    `id` VARCHAR(191) NOT NULL,
    `manufacturerId` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `metadata` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `auditlog_manufacturerId_idx`(`manufacturerId`),
    INDEX `auditlog_batchId_idx`(`batchId`),
    INDEX `auditlog_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `batch_batchNumber_idx` ON `batch`(`batchNumber`);

-- CreateIndex
CREATE INDEX `batch_boxQRCode_idx` ON `batch`(`boxQRCode`);

-- CreateIndex
CREATE INDEX `pill_qrCode_idx` ON `pill`(`qrCode`);

-- CreateIndex
CREATE UNIQUE INDEX `user_googleId_key` ON `user`(`googleId`);

-- AddForeignKey
ALTER TABLE `manufacturer_document` ADD CONSTRAINT `manufacturer_document_manufacturerId_fkey` FOREIGN KEY (`manufacturerId`) REFERENCES `manufacturer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_audit_log` ADD CONSTRAINT `document_audit_log_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `manufacturer_document`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qrasset` ADD CONSTRAINT `qrasset_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditlog` ADD CONSTRAINT `auditlog_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
