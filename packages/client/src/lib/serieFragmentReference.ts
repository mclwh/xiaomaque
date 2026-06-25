// 分镜 reference 数组解析与更新
import type { ProjectAsset } from "@/api/asset";
import { readAssetAppearanceName, readAssetEntityName } from "@/lib/assetParams";

// ASSET_MENTION_TOKEN_PATTERN 内容中资产引用占位符
const ASSET_MENTION_TOKEN_PATTERN = /@asset:(\d+)/g;

// SerieFragmentReferenceItem 分镜引用项
export type SerieFragmentReferenceItem = {
    assetId: number;
    url?: string;
    type?: string;
    characterName?: string;
    appearanceName?: string;
};

// SerieFragmentReferenceBuildOptions 组装 reference 时的可选字段
export type SerieFragmentReferenceBuildOptions = {
    url?: string;
    type?: string;
    characterName?: string;
    appearanceName?: string;
};

// 读取 reference 对象中的非空字符串字段
function readReferenceStringField(record: Record<string, unknown>, ...keys: string[]) {
    for (const key of keys) {
        const value = record[key];

        if (typeof value === "string") {
            const trimmed = value.trim();

            if (trimmed.length > 0) {
                return trimmed;
            }
        }
    }

    return undefined;
}

// 解析角色资产的名称字段（角色名 / 形象名）
export function resolveSerieFragmentReferenceNames(
    asset: Pick<ProjectAsset, "name" | "type" | "params">,
): Pick<SerieFragmentReferenceBuildOptions, "characterName" | "appearanceName"> {
    if (asset.type !== "character") {
        return {};
    }

    const characterName = readAssetEntityName(asset);
    const appearanceName = readAssetAppearanceName(asset);

    return {
        ...(characterName ? { characterName } : {}),
        ...(appearanceName ? { appearanceName } : {}),
    };
}

// 组装写入 fragments JSON 的 reference 对象
function buildSerieFragmentReferenceRecord(
    assetId: number,
    options?: SerieFragmentReferenceBuildOptions,
): Record<string, unknown> {
    // record 写入 JSON 的引用对象
    const record: Record<string, unknown> = { assetId };

    if (options?.url) {
        record.url = options.url;
    }

    if (options?.type) {
        record.type = options.type;
    }

    if (options?.characterName) {
        record.characterName = options.characterName;
    }

    if (options?.appearanceName) {
        record.appearanceName = options.appearanceName;
    }

    return record;
}

// 从资产构建 reference 对象
export function buildSerieFragmentReferenceFromAsset(
    asset: Pick<ProjectAsset, "id" | "name" | "type" | "params" | "url" | "cover">,
    urlOverride?: string | null,
): Record<string, unknown> {
    // normalizedUrl 写入 JSON 的媒体地址
    const normalizedUrl =
        typeof urlOverride === "string" && urlOverride.trim().length > 0
            ? urlOverride.trim()
            : undefined;

    return buildSerieFragmentReferenceRecord(asset.id, {
        ...(normalizedUrl ? { url: normalizedUrl } : {}),
        ...(asset.type ? { type: asset.type } : {}),
        ...resolveSerieFragmentReferenceNames(asset),
    });
}

// 解析单个 reference 项
export function parseSerieFragmentReferenceItem(item: unknown): SerieFragmentReferenceItem | null {
    if (!item || typeof item !== "object") {
        return null;
    }

    // record reference 原始对象
    const record = item as Record<string, unknown>;
    // assetId 资产 ID（兼容全量资产对象中的 id）
    const assetId = record.assetId ?? record.asset_id ?? record.id;

    if (typeof assetId !== "number" || !Number.isFinite(assetId)) {
        return null;
    }

    // url 资产媒体地址
    const url = readReferenceStringField(record, "url");
    // type 资产分类
    const type = readReferenceStringField(record, "type");
    // characterName 角色名称
    const characterName = readReferenceStringField(record, "characterName", "character_name");
    // appearanceName 形象名称
    const appearanceName = readReferenceStringField(record, "appearanceName", "appearance_name");

    return {
        assetId,
        ...(url ? { url } : {}),
        ...(type ? { type } : {}),
        ...(characterName ? { characterName } : {}),
        ...(appearanceName ? { appearanceName } : {}),
    };
}

// 解析 reference 数组
export function parseSerieFragmentReferenceList(reference: unknown): SerieFragmentReferenceItem[] {
    if (!Array.isArray(reference)) {
        return [];
    }

    return reference.flatMap((item) => {
        const parsed = parseSerieFragmentReferenceItem(item);

        return parsed ? [parsed] : [];
    });
}

// 构建资产 ID 到资产的映射
function buildAssetsById(
    assets?: Array<Pick<ProjectAsset, "id" | "name" | "type" | "params">>,
) {
    return new Map((assets ?? []).map((asset) => [asset.id, asset]));
}

// 合并已有引用项与资产解析出的名称字段
function mergeSerieFragmentReferenceOptions(
    existing?: SerieFragmentReferenceItem,
    asset?: Pick<ProjectAsset, "name" | "type" | "params">,
): SerieFragmentReferenceBuildOptions {
    const resolvedNames = asset ? resolveSerieFragmentReferenceNames(asset) : {};

    return {
        ...(existing?.url ? { url: existing.url } : {}),
        ...(existing?.type ?? asset?.type
            ? { type: existing?.type ?? asset?.type }
            : {}),
        ...(existing?.characterName ?? resolvedNames.characterName
            ? { characterName: existing?.characterName ?? resolvedNames.characterName }
            : {}),
        ...(existing?.appearanceName ?? resolvedNames.appearanceName
            ? { appearanceName: existing?.appearanceName ?? resolvedNames.appearanceName }
            : {}),
    };
}

// 向 reference 追加资产（去重，附带 url、type、角色名与形象名）
export function appendSerieFragmentReference(
    reference: unknown[],
    assetId: number,
    options: SerieFragmentReferenceBuildOptions = {},
): unknown[] {
    const existing = parseSerieFragmentReferenceList(reference);

    if (existing.some((item) => item.assetId === assetId)) {
        return reference;
    }

    // normalizedUrl 写入 JSON 的媒体地址
    const normalizedUrl = typeof options.url === "string" ? options.url.trim() : "";
    // normalizedType 写入 JSON 的资产分类
    const normalizedType = typeof options.type === "string" ? options.type.trim() : "";
    // normalizedCharacterName 角色名称
    const normalizedCharacterName =
        typeof options.characterName === "string" ? options.characterName.trim() : "";
    // normalizedAppearanceName 形象名称
    const normalizedAppearanceName =
        typeof options.appearanceName === "string" ? options.appearanceName.trim() : "";

    return [
        ...reference,
        buildSerieFragmentReferenceRecord(assetId, {
            ...(normalizedUrl.length > 0 ? { url: normalizedUrl } : {}),
            ...(normalizedType.length > 0 ? { type: normalizedType } : {}),
            ...(normalizedCharacterName.length > 0 ? { characterName: normalizedCharacterName } : {}),
            ...(normalizedAppearanceName.length > 0 ? { appearanceName: normalizedAppearanceName } : {}),
        }),
    ];
}

// 从 content 中提取仍存在的资产 ID（去重且保留顺序）
export function extractAssetIdsFromFragmentContent(content: string): number[] {
    // seen 已出现的资产 ID
    const seen = new Set<number>();
    // assetIds 按出现顺序排列的资产 ID
    const assetIds: number[] = [];

    for (const match of content.matchAll(ASSET_MENTION_TOKEN_PATTERN)) {
        const assetId = Number(match[1]);

        if (!Number.isFinite(assetId) || seen.has(assetId)) {
            continue;
        }

        seen.add(assetId);
        assetIds.push(assetId);
    }

    return assetIds;
}

// 判断两个 reference 列表是否一致
export function isSameSerieFragmentReferenceList(left: unknown[], right: unknown[]): boolean {
    const parsedLeft = parseSerieFragmentReferenceList(left);
    const parsedRight = parseSerieFragmentReferenceList(right);

    if (parsedLeft.length !== parsedRight.length) {
        return false;
    }

    return parsedLeft.every(
        (item, index) =>
            item.assetId === parsedRight[index]?.assetId &&
            item.url === parsedRight[index]?.url &&
            item.type === parsedRight[index]?.type &&
            item.characterName === parsedRight[index]?.characterName &&
            item.appearanceName === parsedRight[index]?.appearanceName,
    );
}

// 按 content 中仍存在的 @asset 同步 reference（移除已删标签，保留已有字段）
export function syncSerieFragmentReferenceWithContent(
    reference: unknown[],
    content: string,
    assets?: Array<Pick<ProjectAsset, "id" | "name" | "type" | "params">>,
): unknown[] {
    const assetIds = extractAssetIdsFromFragmentContent(content);

    if (assetIds.length === 0) {
        return [];
    }

    // referenceByAssetId 已有引用项映射
    const referenceByAssetId = new Map(
        parseSerieFragmentReferenceList(reference).map((item) => [item.assetId, item]),
    );
    // assetsById 资产映射（用于补全名称）
    const assetsById = buildAssetsById(assets);

    return assetIds.map((assetId) =>
        buildSerieFragmentReferenceRecord(
            assetId,
            mergeSerieFragmentReferenceOptions(
                referenceByAssetId.get(assetId),
                assetsById.get(assetId),
            ),
        ),
    );
}

// 用最新资产信息补全 reference 中的角色名与形象名
export function enrichSerieFragmentReferenceWithAssets(
    reference: unknown[],
    assets: Array<Pick<ProjectAsset, "id" | "name" | "type" | "params">>,
): unknown[] {
    const assetsById = buildAssetsById(assets);

    return parseSerieFragmentReferenceList(reference).map((item) =>
        buildSerieFragmentReferenceRecord(
            item.assetId,
            mergeSerieFragmentReferenceOptions(item, assetsById.get(item.assetId)),
        ),
    );
}
