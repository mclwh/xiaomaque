-- 将历史数据中画布媒体类型从 type 迁移到 asset_type，type 设为 none（未归类）
UPDATE `asset`
SET
    `asset_type` = `type`,
    `type` = 'none'
WHERE `type` IN ('video', 'image', 'text', 'audio');
