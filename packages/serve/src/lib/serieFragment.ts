// 分集分镜片段：JSON 载荷解析与 API 序列化
import type { ApiAssetPayload } from "./formatAsset.js";
import { formatAssetForApi } from "./formatAsset.js";
import { readSerieFragmentLastFrameKey, type SerieFragmentParams } from "./serieFragmentParams.js";
import { normalizeStorageKeyForSave } from "./storagePath.js";
import { resolveAssetMediaUrl } from "./storageUrl.js";

// SerieFragmentApiPayload 分镜片段 API 结构（与前端 fragments 数组项一致）
export type SerieFragmentApiPayload = {
    id: number;
    content: string;
    reference: ApiAssetPayload[];
    cover: string;
    video: string;
    durationSec?: number;
    params?: SerieFragmentParams;
};

// SerieFragmentReferenceAsset 引用关联的资产记录
export type SerieFragmentReferenceAsset = Parameters<typeof formatAssetForApi>[0];

// SerieFragmentDbRow 数据库分镜行（含引用）
export type SerieFragmentDbRow = {
    id: number;
    sort_order: number;
    content: string;
    cover: string | null;
    video: string | null;
    duration_sec: number | null;
    params: unknown;
    asset_references: Array<{
        asset_id: number;
        asset: SerieFragmentReferenceAsset;
    }>;
};

// SerieFragmentSaveInput 保存分镜时的结构化输入
export type SerieFragmentSaveInput = {
    id: number | null;
    sortOrder: number;
    content: string;
    cover: string;
    video: string;
    durationSec: number | null;
    references: SerieFragmentReferenceSaveInput[];
};

// SerieFragmentReferenceSaveInput 保存引用项时的结构化输入
export type SerieFragmentReferenceSaveInput = {
    assetId: number;
};

// 解析保存载荷中的分镜数据库 ID（临时客户端 ID 返回 null）
export function parseSerieFragmentDbId(raw: unknown): number | null {
    if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
        return Math.trunc(raw);
    }

    if (typeof raw === "string" && /^\d+$/.test(raw.trim())) {
        return Number(raw.trim());
    }

    return null;
}

// 读取分镜 content 字段（兼容 description / prompt）
function readFragmentContent(raw: Record<string, unknown>): string {
    if (typeof raw.content === "string") {
        return raw.content;
    }

    if (typeof raw.description === "string") {
        return raw.description;
    }

    if (typeof raw.prompt === "string") {
        return raw.prompt;
    }

    return "";
}

// 解析单个引用保存项（仅存 assetId，兼容全量资产对象）
export function parseSerieFragmentReferenceSaveItem(item: unknown): SerieFragmentReferenceSaveInput | null {
    if (!item || typeof item !== "object") {
        return null;
    }

    // record 原始引用对象
    const record = item as Record<string, unknown>;
    // assetId 资产 ID（兼容全量资产对象中的 id）
    const assetIdRaw = record.assetId ?? record.asset_id ?? record.id;

    if (typeof assetIdRaw !== "number" || !Number.isFinite(assetIdRaw) || assetIdRaw <= 0) {
        return null;
    }

    return {
        assetId: Math.trunc(assetIdRaw),
    };
}

// 解析单个分镜保存项
export function parseSerieFragmentSaveItem(
    item: unknown,
    sortOrder: number,
): SerieFragmentSaveInput | null {
    if (!item || typeof item !== "object") {
        return null;
    }

    // record 原始分镜对象
    const record = item as Record<string, unknown>;
    // durationSec 分镜时长
    const durationSecRaw = record.durationSec ?? record.duration;
    // references 引用列表
    const referencesRaw = Array.isArray(record.reference) ? record.reference : [];

    return {
        id: parseSerieFragmentDbId(record.id),
        sortOrder,
        content: readFragmentContent(record),
        cover: normalizeStorageKeyForSave(typeof record.cover === "string" ? record.cover : ""),
        video: normalizeStorageKeyForSave(typeof record.video === "string" ? record.video : ""),
        durationSec:
            typeof durationSecRaw === "number" && Number.isFinite(durationSecRaw)
                ? Math.trunc(durationSecRaw)
                : null,
        references: referencesRaw.flatMap((referenceItem) => {
            const parsed = parseSerieFragmentReferenceSaveItem(referenceItem);

            return parsed ? [parsed] : [];
        }),
    };
}

// 解析分镜保存列表
export function parseSerieFragmentSaveList(fragments: unknown[]): SerieFragmentSaveInput[] {
    return fragments.flatMap((item, index) => {
        const parsed = parseSerieFragmentSaveItem(item, index);

        return parsed ? [parsed] : [];
    });
}

// 将分镜 params 序列化为 API 载荷（尾帧 key 转为私有空间签名 URL）
function serializeSerieFragmentParams(params: unknown): SerieFragmentParams | undefined {
    const lastFrameKey = readSerieFragmentLastFrameKey(params);

    if (!lastFrameKey) {
        return undefined;
    }

    return {
        lastFrame: resolveAssetMediaUrl(lastFrameKey) ?? lastFrameKey,
    };
}

// 将数据库分镜行序列化为 API 载荷
export function serializeSerieFragmentRow(fragment: SerieFragmentDbRow): SerieFragmentApiPayload {
    const serializedParams = serializeSerieFragmentParams(fragment.params);
    const coverKey = fragment.cover?.trim() ?? "";
    const videoKey = fragment.video?.trim() ?? "";

    return {
        id: fragment.id,
        content: fragment.content ?? "",
        reference: fragment.asset_references.map((reference) =>
            formatAssetForApi(reference.asset),
        ),
        cover: coverKey ? (resolveAssetMediaUrl(coverKey) ?? coverKey) : "",
        video: videoKey ? (resolveAssetMediaUrl(videoKey) ?? videoKey) : "",
        ...(fragment.duration_sec !== null ? { durationSec: fragment.duration_sec } : {}),
        ...(serializedParams ? { params: serializedParams } : {}),
    };
}

// 将数据库分镜列表序列化为 API fragments 数组
export function serializeSerieFragmentRows(fragments: SerieFragmentDbRow[]): SerieFragmentApiPayload[] {
    return [...fragments]
        .sort((left, right) => left.sort_order - right.sort_order)
        .map(serializeSerieFragmentRow);
}

// 将 API 分镜列表转为仅含 id 的轻量数组（列表接口状态判断用）
export function serializeSerieFragmentIdStubs(fragments: SerieFragmentDbRow[]): Array<{ id: number }> {
    return [...fragments]
        .sort((left, right) => left.sort_order - right.sort_order)
        .map((fragment) => ({ id: fragment.id }));
}
