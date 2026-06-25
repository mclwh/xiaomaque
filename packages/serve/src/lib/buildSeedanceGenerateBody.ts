import type { ApiAssetPayload } from "./formatAsset.js";
import { readAssetEntityName } from "./assetNames.js";
import { resolveImageStylePrompt, type ImageStyleId } from "./imageStyles.js";
import {
    replaceDurationMentionsWithTimeRanges,
    resolveSeedanceDurationFromContent,
} from "./fragmentContentDuration.js";
import {
    resolveSeedanceModelEndpoint,
    resolveSeedanceRatio,
    resolveSeedanceResolution,
} from "./seedanceModels.js";

// ASSET_MENTION_TOKEN_PATTERN 分镜脚本中的 @asset 占位符
const ASSET_MENTION_TOKEN_PATTERN = /@asset:(\d+)/g;

// SEEDANCE_VISUAL_STYLE_SECTION_INTRO 视频画面风格强制声明
const SEEDANCE_VISUAL_STYLE_SECTION_INTRO =
    "【强制约束：视频画面风格】全片画面必须严格遵循以下风格描述，严禁偏离、弱化或混用其他画风与镜头美学：";

// SEEDANCE_CHARACTER_VOICE_SECTION_HEADER 角色音色强制声明
const SEEDANCE_CHARACTER_VOICE_SECTION_HEADER =
    "【强制约束：角色音色】以下角色说话的音色、语气、节奏与发声质感必须与对应参考音频严格一致，严禁替换、混用其他声线或自行改写：";

// SEEDANCE_CHARACTER_APPEARANCE_SECTION_HEADER 角色形象强制声明
const SEEDANCE_CHARACTER_APPEARANCE_SECTION_HEADER =
    "【强制约束：角色形象】以下角色的面容、体型、发型、服饰与整体气质必须与对应参考图严格一致，严禁换脸、形象漂移或重绘为其他人物：";

// SEEDANCE_SCENE_SECTION_HEADER 场景强制声明
const SEEDANCE_SCENE_SECTION_HEADER =
    "【强制约束：场景】以下场景的空间结构、环境陈设、光影氛围必须与对应参考图严格一致，严禁替换为其他场景或大幅偏离参考画面：";

// SeedanceContentItem 豆包原生 content 数组项
export type SeedanceContentItem =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string }; role: "reference_image" }
    | { type: "audio_url"; audio_url: { url: string }; role: "reference_audio" };

// SeedanceGenerateBody 提交火山方舟 Seedance 的请求体
export type SeedanceGenerateBody = {
    model: string;
    content: SeedanceContentItem[];
    duration: number;
    ratio: string;
    resolution: string;
    watermark: boolean;
    return_last_frame: boolean;
};

// BuildSeedanceGenerateBodyInput 组装 Seedance 请求体的输入
export type BuildSeedanceGenerateBodyInput = {
    content?: string;
    reference?: ApiAssetPayload[];
    model_id?: string;
    aspect_ratio?: string;
    resolution?: string;
    video_style_id?: ImageStyleId;
};

// SeedanceReferenceFile 参考文件条目（图片或音频）
type SeedanceReferenceFile = {
    assetId: number;
    url: string;
};

// SeedanceReferenceCatalog 参考图/音频目录与索引映射（参考图全局连续编号，参考音频独立编号）
export type SeedanceReferenceCatalog = {
    images: SeedanceReferenceFile[];
    audios: SeedanceReferenceFile[];
    imageIndexByAssetId: Map<number, number>;
    audioIndexByAssetId: Map<number, number>;
};

// 读取角色绑定的音频 URL（params.canvas.voiceAudio）
function readAssetVoiceAudioUrl(params: unknown): string | null {
    if (!params || typeof params !== "object") {
        return null;
    }

    const canvas = (params as Record<string, unknown>).canvas;

    if (!canvas || typeof canvas !== "object") {
        return null;
    }

    const voiceAudio = (canvas as Record<string, unknown>).voiceAudio;

    if (!voiceAudio || typeof voiceAudio !== "object") {
        return null;
    }

    const url = (voiceAudio as Record<string, unknown>).url;

    return typeof url === "string" && url.trim().length > 0 ? url.trim() : null;
}

// 解析资产可用的图片 URL（优先 cover）
function resolveReferenceImageUrl(asset: ApiAssetPayload): string | null {
    const cover = asset.cover?.trim();
    const url = asset.url?.trim();

    if (asset.assetType === "image" || asset.type === "character" || asset.type === "scene") {
        return cover || url || null;
    }

    return cover || (asset.assetType === "image" ? url : null) || null;
}

// 解析写入提示词的角色名称（不含形象名）
function resolveCharacterPromptName(asset: ApiAssetPayload): string {
    return readAssetEntityName(asset) ?? asset.name?.trim() ?? "角色";
}

// 解析写入提示词的场景名称
function resolveScenePromptName(asset: ApiAssetPayload): string {
    return readAssetEntityName(asset) ?? asset.name?.trim() ?? "场景";
}

// 解析写入提示词的其他资产名称
function resolveOtherAssetPromptName(asset: ApiAssetPayload): string {
    return readAssetEntityName(asset) ?? asset.name?.trim() ?? `资产#${asset.id}`;
}

// 从引用资产构建参考图/音频目录（参考图按引用顺序全局编号，参考音频独立编号）
export function buildSeedanceReferenceCatalog(
    reference: ApiAssetPayload[] | undefined,
): SeedanceReferenceCatalog {
    const images: SeedanceReferenceFile[] = [];
    const audios: SeedanceReferenceFile[] = [];
    const seenImageAssetIds = new Set<number>();
    const seenAudioAssetIds = new Set<number>();

    for (const asset of reference ?? []) {
        const imageUrl = resolveReferenceImageUrl(asset);

        if (imageUrl && !seenImageAssetIds.has(asset.id)) {
            seenImageAssetIds.add(asset.id);
            images.push({ assetId: asset.id, url: imageUrl });
        }

        if (asset.type === "character") {
            const voiceAudioUrl = readAssetVoiceAudioUrl(asset.params);

            if (voiceAudioUrl && !seenAudioAssetIds.has(asset.id)) {
                seenAudioAssetIds.add(asset.id);
                audios.push({ assetId: asset.id, url: voiceAudioUrl });
            }
        }
    }

    return {
        images,
        audios,
        imageIndexByAssetId: new Map(images.map((item, index) => [item.assetId, index + 1])),
        audioIndexByAssetId: new Map(audios.map((item, index) => [item.assetId, index + 1])),
    };
}

// 正文中的 @asset 替换文案（不含角色/场景类型前缀）
function formatBodyAssetMention(name: string, imageIndex: number | undefined): string {
    if (imageIndex !== undefined) {
        return `${name}（参考图${imageIndex}）`;
    }

    return name;
}

// 将单个 @asset 占位符替换为正文中的资产描述
function replaceAssetMentionToken(
    assetId: number,
    assetById: Map<number, ApiAssetPayload>,
    catalog: SeedanceReferenceCatalog,
): string {
    const asset = assetById.get(assetId);

    if (!asset) {
        return "";
    }

    const imageIndex = catalog.imageIndexByAssetId.get(asset.id);

    if (asset.type === "character") {
        return formatBodyAssetMention(resolveCharacterPromptName(asset), imageIndex);
    }

    if (asset.type === "scene") {
        return formatBodyAssetMention(resolveScenePromptName(asset), imageIndex);
    }

    return formatBodyAssetMention(resolveOtherAssetPromptName(asset), imageIndex);
}

// 组装【画面风格】声明块
function buildVisualStyleSection(videoStyleId?: ImageStyleId): string | null {
    const stylePrompt = resolveImageStylePrompt(videoStyleId);

    if (!stylePrompt) {
        return null;
    }

    return `${SEEDANCE_VISUAL_STYLE_SECTION_INTRO}\n${stylePrompt}`;
}

// 组装【角色音色】声明块
function buildCharacterVoiceSection(
    reference: ApiAssetPayload[] | undefined,
    catalog: SeedanceReferenceCatalog,
): string | null {
    const lines: string[] = [];
    const seenAssetIds = new Set<number>();

    for (const asset of reference ?? []) {
        if (asset.type !== "character" || seenAssetIds.has(asset.id)) {
            continue;
        }

        seenAssetIds.add(asset.id);

        const audioIndex = catalog.audioIndexByAssetId.get(asset.id);

        if (audioIndex === undefined) {
            continue;
        }

        lines.push(`${resolveCharacterPromptName(asset)}：参考音频${audioIndex}`);
    }

    if (lines.length === 0) {
        return null;
    }

    return `${SEEDANCE_CHARACTER_VOICE_SECTION_HEADER}\n${lines.join("\n")}`;
}

// 组装【角色形象】声明块
function buildCharacterAppearanceSection(
    reference: ApiAssetPayload[] | undefined,
    catalog: SeedanceReferenceCatalog,
): string | null {
    const lines: string[] = [];
    const seenAssetIds = new Set<number>();

    for (const asset of reference ?? []) {
        if (asset.type !== "character" || seenAssetIds.has(asset.id)) {
            continue;
        }

        seenAssetIds.add(asset.id);

        const imageIndex = catalog.imageIndexByAssetId.get(asset.id);

        if (imageIndex === undefined) {
            continue;
        }

        lines.push(`${resolveCharacterPromptName(asset)}：参考图${imageIndex}`);
    }

    if (lines.length === 0) {
        return null;
    }

    return `${SEEDANCE_CHARACTER_APPEARANCE_SECTION_HEADER}\n${lines.join("\n")}`;
}

// 组装【场景】声明块
function buildSceneSection(
    reference: ApiAssetPayload[] | undefined,
    catalog: SeedanceReferenceCatalog,
): string | null {
    const lines: string[] = [];
    const seenAssetIds = new Set<number>();

    for (const asset of reference ?? []) {
        if (asset.type !== "scene" || seenAssetIds.has(asset.id)) {
            continue;
        }

        seenAssetIds.add(asset.id);

        const imageIndex = catalog.imageIndexByAssetId.get(asset.id);

        if (imageIndex === undefined) {
            continue;
        }

        lines.push(`${resolveScenePromptName(asset)}：参考图${imageIndex}`);
    }

    if (lines.length === 0) {
        return null;
    }

    return `${SEEDANCE_SCENE_SECTION_HEADER}\n${lines.join("\n")}`;
}

// 将分镜脚本转为正文提示词（@duration 替换为时间区间，@asset 替换为资产描述）
function buildSeedanceBodyText(
    content: string | undefined,
    reference: ApiAssetPayload[] | undefined,
    catalog: SeedanceReferenceCatalog,
): string {
    const assetById = new Map((reference ?? []).map((asset) => [asset.id, asset]));

    return replaceDurationMentionsWithTimeRanges(content ?? "")
        .replace(ASSET_MENTION_TOKEN_PATTERN, (_match, assetIdRaw: string) =>
            replaceAssetMentionToken(Number(assetIdRaw), assetById, catalog),
        )
        .replace(/\s+/g, " ")
        .trim();
}

// 将分镜脚本转为 Seedance 结构化文本提示词
export function buildSeedancePromptText(
    content: string | undefined,
    reference: ApiAssetPayload[] | undefined,
    catalog: SeedanceReferenceCatalog = buildSeedanceReferenceCatalog(reference),
    videoStyleId?: ImageStyleId,
): string {
    const sections: string[] = [];
    const styleSection = buildVisualStyleSection(videoStyleId);
    const voiceSection = buildCharacterVoiceSection(reference, catalog);
    const appearanceSection = buildCharacterAppearanceSection(reference, catalog);
    const sceneSection = buildSceneSection(reference, catalog);
    const bodyText = buildSeedanceBodyText(content, reference, catalog);

    if (styleSection) {
        sections.push(styleSection);
    }

    if (voiceSection) {
        sections.push(voiceSection);
    }

    if (appearanceSection) {
        sections.push(appearanceSection);
    }

    if (sceneSection) {
        sections.push(sceneSection);
    }

    if (bodyText) {
        sections.push(bodyText);
    }

    return sections.join("\n\n");
}

// 从引用资产组装 Seedance content 多模态数组
function buildSeedanceContentItems(
    content: string | undefined,
    reference: ApiAssetPayload[] | undefined,
    videoStyleId?: ImageStyleId,
): SeedanceContentItem[] {
    const catalog = buildSeedanceReferenceCatalog(reference);
    const promptText = buildSeedancePromptText(content, reference, catalog, videoStyleId);
    const items: SeedanceContentItem[] = [];

    if (promptText.length > 0) {
        items.push({ type: "text", text: promptText });
    }

    for (const image of catalog.images) {
        items.push({
            type: "image_url",
            image_url: { url: image.url },
            role: "reference_image",
        });
    }

    for (const audio of catalog.audios) {
        items.push({
            type: "audio_url",
            audio_url: { url: audio.url },
            role: "reference_audio",
        });
    }

    return items;
}

// 将分镜生成参数转为提交 Seedance 的请求体
export function buildSeedanceGenerateBody(
    input: BuildSeedanceGenerateBodyInput,
): SeedanceGenerateBody {
    return {
        model: resolveSeedanceModelEndpoint(input.model_id),
        content: buildSeedanceContentItems(input.content, input.reference, input.video_style_id),
        duration: resolveSeedanceDurationFromContent(input.content),
        ratio: resolveSeedanceRatio(input.aspect_ratio),
        resolution: resolveSeedanceResolution(input.resolution),
        watermark: false,
        return_last_frame: true,
    };
}
