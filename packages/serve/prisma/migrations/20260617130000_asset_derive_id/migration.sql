-- 资产分组字段 group_id 重命名为 derive_id
DROP INDEX `asset_group_id_idx` ON `asset`;
ALTER TABLE `asset` CHANGE COLUMN `group_id` `derive_id` VARCHAR(10) NULL;
CREATE INDEX `asset_derive_id_idx` ON `asset`(`derive_id`);
