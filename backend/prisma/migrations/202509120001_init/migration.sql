-- Initial migration generated manually to match current Prisma schema
-- Database: MySQL
-- WARNING: Hand-written migration. If you later run `prisma migrate dev` it should detect this as baseline.

-- Enums are represented as MySQL ENUM types.

CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `username` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `role` ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER',
  `lastLoginAt` DATETIME(3) NULL,
  `deletionRequestedAt` DATETIME(3) NULL,
  `deletionEffectiveAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `activatedGamesCount` INT NOT NULL DEFAULT 0,
  UNIQUE INDEX `User_username_key`(`username`),
  UNIQUE INDEX `User_email_key`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Game` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `path` VARCHAR(191) NOT NULL,
  `coverImage` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `activationCount` INT NOT NULL DEFAULT 0,
  `playCount` INT NOT NULL DEFAULT 0,
  `status` ENUM('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  UNIQUE INDEX `Game_name_key`(`name`),
  UNIQUE INDEX `Game_path_key`(`path`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ActivationCode` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `status` ENUM('UNUSED','ACTIVATED') NOT NULL DEFAULT 'UNUSED',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `activatedAt` DATETIME(3) NULL,
  `gameId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  UNIQUE INDEX `ActivationCode_code_key`(`code`),
  INDEX `ActivationCode_gameId_idx`(`gameId`),
  INDEX `ActivationCode_userId_idx`(`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UserGameActivation` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `gameId` VARCHAR(191) NOT NULL,
  `activatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `activationCodeId` VARCHAR(191) NULL,
  UNIQUE INDEX `UserGameActivation_userId_gameId_key`(`userId`, `gameId`),
  INDEX `UserGameActivation_userId_idx`(`userId`),
  INDEX `UserGameActivation_gameId_idx`(`gameId`),
  INDEX `UserGameActivation_activatedAt_idx`(`activatedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Log` (
  `id` VARCHAR(191) NOT NULL,
  `message` VARCHAR(500) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `type` ENUM('USER_REGISTER','USER_LOGIN','USER_LOGIN_FAILED','USER_LOGOUT','USER_PASSWORD_CHANGE','USER_PROFILE_UPDATE','USER_ACCOUNT_DELETE_REQUEST','USER_ACCOUNT_DELETE_CANCEL','USER_ACCOUNT_DELETED','GAME_ACTIVATION','GAME_ACTIVATION_FAILED','GAME_PLAY_VALID','CODE_ACTIVATION_SUCCESS','CODE_ACTIVATION_FAILED','CODE_ALREADY_USED','CODE_NOT_FOUND','CODE_EXPIRED','FILE_UPLOAD','FILE_UPLOAD_FAILED','FILE_DELETE','ADMIN_USER_CREATE','ADMIN_USER_UPDATE','ADMIN_USER_DELETE','ADMIN_GAME_CREATE','ADMIN_GAME_UPDATE','ADMIN_GAME_DELETE','ADMIN_CODE_CREATE','ADMIN_CODE_UPDATE','ADMIN_CODE_DELETE','ADMIN_SETTINGS_UPDATE','ADMIN_LOGIN','ADMIN_LOGOUT','SYSTEM_ERROR','SYSTEM_WARNING','SYSTEM_MAINTENANCE_START','SYSTEM_MAINTENANCE_END','SECURITY_UNAUTHORIZED_ACCESS','SECURITY_RATE_LIMIT_EXCEEDED','SECURITY_SUSPICIOUS_ACTIVITY','SECURITY_IP_BLOCKED') NOT NULL,
  `userId` VARCHAR(191) NULL,
  `gameId` VARCHAR(191) NULL,
  `activationCodeId` VARCHAR(191) NULL,
  `targetUserId` VARCHAR(191) NULL,
  `ip` VARCHAR(45) NULL,
  `userAgent` VARCHAR(512) NULL,
  `metadata` JSON NULL,
  INDEX `Log_type_createdAt_idx`(`type`, `createdAt`),
  INDEX `Log_userId_createdAt_idx`(`userId`, `createdAt`),
  INDEX `Log_gameId_createdAt_idx`(`gameId`, `createdAt`),
  INDEX `Log_activationCodeId_createdAt_idx`(`activationCodeId`, `createdAt`),
  INDEX `Log_targetUserId_createdAt_idx`(`targetUserId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SystemSettings` (
  `key` VARCHAR(191) NOT NULL,
  `value` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PasswordHistory` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `PasswordHistory_userId_createdAt_idx`(`userId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign Keys
ALTER TABLE `ActivationCode` ADD CONSTRAINT `ActivationCode_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ActivationCode` ADD CONSTRAINT `ActivationCode_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `UserGameActivation` ADD CONSTRAINT `UserGameActivation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `UserGameActivation` ADD CONSTRAINT `UserGameActivation_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `UserGameActivation` ADD CONSTRAINT `UserGameActivation_activationCodeId_fkey` FOREIGN KEY (`activationCodeId`) REFERENCES `ActivationCode`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Log` ADD CONSTRAINT `Log_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Log` ADD CONSTRAINT `Log_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Log` ADD CONSTRAINT `Log_activationCodeId_fkey` FOREIGN KEY (`activationCodeId`) REFERENCES `ActivationCode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Log` ADD CONSTRAINT `Log_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `PasswordHistory` ADD CONSTRAINT `PasswordHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
