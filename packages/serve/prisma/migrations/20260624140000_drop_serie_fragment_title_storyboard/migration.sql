-- DropForeignKey
ALTER TABLE `serie_fragment` DROP FOREIGN KEY `serie_fragment_storyboard_asset_id_fkey`;

-- DropIndex
DROP INDEX `serie_fragment_storyboard_asset_id_idx` ON `serie_fragment`;

-- AlterTable
ALTER TABLE `serie_fragment`
    DROP COLUMN `title`,
    DROP COLUMN `storyboard_asset_id`;
