import { randomUUID } from "crypto";

// STORAGE_ROOT_PREFIX 应用资源在对象存储中的根前缀
export const STORAGE_ROOT_PREFIX = "xiaomaque";

// StorageCategory 资源分类目录
export type StorageCategory = "image" | "video" | "audio";

// STORAGE_CATEGORIES 允许申请上传 token 的资源分类
export const STORAGE_CATEGORIES = ["image", "video", "audio"] as const;

// 将存储 key 转为七牛 object key（去掉 leading slash）
export function toObjectKey(storageKey: string): string {
    return storageKey.startsWith("/") ? storageKey.slice(1) : storageKey;
}

// 将保存载荷中的 cover/video 归一化为数据库存储 key（兼容签名 URL 与裸 key）
export function normalizeStorageKeyForSave(raw: string): string {
    const trimmed = raw.trim();

    if (!trimmed) {
        return "";
    }

    if (!/^https?:\/\//i.test(trimmed)) {
        return trimmed.split("?")[0] ?? "";
    }

    try {
        const pathname = new URL(trimmed).pathname;

        if (!pathname || pathname === "/") {
            return "";
        }

        return pathname.startsWith("/") ? pathname : `/${pathname}`;
    } catch {
        return trimmed;
    }
}

// 构建带 /xiaomaque 前缀的存储 key，例如 /xiaomaque/image/xxx.png
export function buildStorageKey(category: StorageCategory, ext: string): string {
    const normalizedExt = ext.replace(/^\./, "").toLowerCase() || "bin";
    const filename = `${randomUUID()}.${normalizedExt}`;

    return `/${STORAGE_ROOT_PREFIX}/${category}/${filename}`;
}
