-- 资产引用关系由 reference_id 改为 group_id
ALTER TABLE `asset` DROP FOREIGN KEY `asset_reference_id_fkey`;
DROP INDEX `asset_reference_id_idx` ON `asset`;
ALTER TABLE `asset` DROP COLUMN `reference_id`;
ALTER TABLE `asset` ADD COLUMN `group_id` VARCHAR(10) NULL;
CREATE INDEX `asset_group_id_idx` ON `asset`(`group_id`);
