-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `role` ENUM('PATIENT', 'PHARMACY', 'MANUFACTURER', 'REGULATOR', 'ADMIN', 'SUPER_ADMIN', 'DRAP_ADMIN', 'FRAUD_ANALYST', 'AUDITOR') NOT NULL DEFAULT 'PATIENT',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `refreshToken` VARCHAR(512) NOT NULL,
    `userAgent` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `session_refreshToken_key`(`refreshToken`),
    INDEX `session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `manufacturer` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `licenseNumber` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,

    UNIQUE INDEX `manufacturer_userId_key`(`userId`),
    UNIQUE INDEX `manufacturer_licenseNumber_key`(`licenseNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pharmacy` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `licenseNumber` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `riskScore` DOUBLE NOT NULL DEFAULT 0,
    `isBlacklisted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `pharmacy_userId_key`(`userId`),
    UNIQUE INDEX `pharmacy_licenseNumber_key`(`licenseNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medicine` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `manufacturerId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `medicine_manufacturerId_idx`(`manufacturerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batch` (
    `id` VARCHAR(191) NOT NULL,
    `batchNumber` VARCHAR(191) NOT NULL,
    `medicineId` VARCHAR(191) NOT NULL,
    `manufacturingDate` DATETIME(3) NOT NULL,
    `expiryDate` DATETIME(3) NOT NULL,
    `quantityBoxes` INTEGER NOT NULL DEFAULT 1,
    `pillsPerBox` INTEGER NOT NULL DEFAULT 20,
    `totalPillsGenerated` INTEGER NOT NULL DEFAULT 0,
    `boxQRCode` VARCHAR(191) NULL,
    `dosageStrength` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `productType` VARCHAR(191) NULL,
    `medicineStatus` VARCHAR(191) NOT NULL DEFAULT 'MANUFACTURED',
    `blockchainStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `isRecalled` BOOLEAN NOT NULL DEFAULT false,
    `recallReason` VARCHAR(191) NULL,
    `txHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `batch_batchNumber_key`(`batchNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pill` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `pillNumber` VARCHAR(191) NOT NULL,
    `qrCode` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `scannedAt` DATETIME(3) NULL,
    `scannedLocation` VARCHAR(191) NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'UNVERIFIED',
    `blockchainTx` VARCHAR(191) NULL,

    UNIQUE INDEX `pill_qrCode_key`(`qrCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qrdownload` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `batchNumber` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `downloadUrl` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verificationlog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `pillId` VARCHAR(191) NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` ENUM('GENUINE', 'DUPLICATE', 'SUSPECTED', 'INVALID') NOT NULL,
    `location` VARCHAR(191) NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `verificationlog_code_idx`(`code`),
    INDEX `verificationlog_userId_idx`(`userId`),
    INDEX `verificationlog_pillId_idx`(`pillId`),
    INDEX `verificationlog_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fraudalert` (
    `id` VARCHAR(191) NOT NULL,
    `alertType` VARCHAR(191) NOT NULL,
    `qrCode` VARCHAR(191) NULL,
    `medicineId` VARCHAR(191) NULL,
    `pharmacyId` VARCHAR(191) NULL,
    `region` VARCHAR(191) NULL,
    `severity` VARCHAR(191) NOT NULL,
    `riskScore` INTEGER NOT NULL DEFAULT 0,
    `message` VARCHAR(191) NOT NULL,
    `metadata` TEXT NULL,
    `isResolved` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riskscore` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `riskLevel` VARCHAR(191) NOT NULL,
    `reasons` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `geoanalytics` (
    `id` VARCHAR(191) NOT NULL,
    `qrCode` VARCHAR(191) NOT NULL,
    `previousLocation` VARCHAR(191) NULL,
    `currentLocation` VARCHAR(191) NOT NULL,
    `distance` DOUBLE NULL,
    `suspicious` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recall` (
    `id` VARCHAR(191) NOT NULL,
    `medicineId` VARCHAR(191) NULL,
    `batchId` VARCHAR(191) NULL,
    `severity` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `regions` VARCHAR(191) NULL,
    `issuedBy` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `adminactionlog` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `actionType` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `surveillanceevent` (
    `id` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NULL,
    `metadata` TEXT NULL,
    `blockchainHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `medicineName` VARCHAR(191) NOT NULL,
    `batchNumber` VARCHAR(191) NULL,
    `pharmacyName` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aiinsight` (
    `id` VARCHAR(191) NOT NULL,
    `insightType` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL,
    `prediction` TEXT NOT NULL,
    `confidenceScore` DOUBLE NOT NULL DEFAULT 0,
    `region` VARCHAR(191) NULL,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `liveevent` (
    `id` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `payload` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riskforecast` (
    `id` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `medicineId` VARCHAR(191) NULL,
    `predictedRisk` INTEGER NOT NULL DEFAULT 0,
    `confidence` DOUBLE NOT NULL DEFAULT 0,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `targetRole` ENUM('PATIENT', 'PHARMACY', 'MANUFACTURER', 'REGULATOR', 'ADMIN', 'SUPER_ADMIN', 'DRAP_ADMIN', 'FRAUD_ANALYST', 'AUDITOR') NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notification_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blockchaintransaction` (
    `id` VARCHAR(191) NOT NULL,
    `txHash` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'CONFIRMED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `blockchaintransaction_txHash_key`(`txHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manufacturer` ADD CONSTRAINT `manufacturer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pharmacy` ADD CONSTRAINT `pharmacy_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medicine` ADD CONSTRAINT `medicine_manufacturerId_fkey` FOREIGN KEY (`manufacturerId`) REFERENCES `manufacturer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batch` ADD CONSTRAINT `batch_medicineId_fkey` FOREIGN KEY (`medicineId`) REFERENCES `medicine`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pill` ADD CONSTRAINT `pill_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verificationlog` ADD CONSTRAINT `verificationlog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verificationlog` ADD CONSTRAINT `verificationlog_pillId_fkey` FOREIGN KEY (`pillId`) REFERENCES `pill`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report` ADD CONSTRAINT `report_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
