-- AlterTable（须在 20260624120000_serie_fragment_table 之后执行）
ALTER TABLE `serie_fragment` ADD COLUMN `params` JSON NULL;
