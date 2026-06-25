/*
  Warnings:

  - You are about to drop the column `content` on the `script` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serie_id]` on the table `script` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `script` DROP COLUMN `content`,
    ADD COLUMN `serie_content` JSON NULL,
    ADD COLUMN `serie_id` INTEGER NULL,
    ADD COLUMN `source` TEXT NULL,
    ADD COLUMN `summary` JSON NULL;

-- CreateIndex
CREATE UNIQUE INDEX `script_serie_id_key` ON `script`(`serie_id`);

-- AddForeignKey
ALTER TABLE `script` ADD CONSTRAINT `script_serie_id_fkey` FOREIGN KEY (`serie_id`) REFERENCES `serie`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
