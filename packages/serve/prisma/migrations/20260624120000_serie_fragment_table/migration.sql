-- CreateTable
CREATE TABLE `serie_fragment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serie_id` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `content` TEXT NOT NULL,
    `cover` VARCHAR(191) NOT NULL DEFAULT '',
    `video` VARCHAR(191) NOT NULL DEFAULT '',
    `duration_sec` INTEGER NULL,
    `storyboard_asset_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `serie_fragment_serie_id_idx`(`serie_id`),
    INDEX `serie_fragment_storyboard_asset_id_idx`(`storyboard_asset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `serie_fragment_reference` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fragment_id` INTEGER NOT NULL,
    `asset_id` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `url` VARCHAR(191) NULL,
    `asset_type` VARCHAR(191) NULL,
    `character_name` VARCHAR(191) NULL,
    `appearance_name` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `serie_fragment_reference_fragment_id_idx`(`fragment_id`),
    INDEX `serie_fragment_reference_asset_id_idx`(`asset_id`),
    UNIQUE INDEX `serie_fragment_reference_fragment_id_asset_id_key`(`fragment_id`, `asset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `serie_fragment` ADD CONSTRAINT `serie_fragment_serie_id_fkey` FOREIGN KEY (`serie_id`) REFERENCES `serie`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `serie_fragment` ADD CONSTRAINT `serie_fragment_storyboard_asset_id_fkey` FOREIGN KEY (`storyboard_asset_id`) REFERENCES `asset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `serie_fragment_reference` ADD CONSTRAINT `serie_fragment_reference_fragment_id_fkey` FOREIGN KEY (`fragment_id`) REFERENCES `serie_fragment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `serie_fragment_reference` ADD CONSTRAINT `serie_fragment_reference_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
