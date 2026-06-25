// 资产 params 字段的类型定义（与 packages/serve/prisma asset.params Json 对应）
import type { ImageStyleId } from "@/lib/imageStyles";

// ASSET_PARAMS_CANVAS_KEY params 中画布数据的命名空间 key
export const ASSET_PARAMS_CANVAS_KEY = "canvas" as const;

// CanvasPosition 画布节点坐标
export type CanvasPosition = {
    x: number;
    y: number;
};

// CanvasLayoutEdge 画布连线（仅存于 ID 最小的锚点节点 params.canvas.edges）
export type CanvasLayoutEdge = {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
};

// CanvasGenerationSettings 生图参数（params.canvas.generation）
export type CanvasGenerationSettings = {
    prompt: string;
    modelId: string;
    aspectRatio: string;
    resolution: string;
    imageStyleId?: ImageStyleId;
    sourceUrl?: string;
};

// CanvasAudioReferenceFile 音频参考文件
export type CanvasAudioReferenceFile = {
    key: string;
    name: string;
};

// CanvasAudioGenerationSettings 音频生成参数（params.canvas.audioGeneration）
export type CanvasAudioGenerationSettings = {
    prompt: string;
    referenceFiles?: CanvasAudioReferenceFile[];
};

// AudioCharacterBindingMode 音频绑定角色的模式
export type AudioCharacterBindingMode = "single" | "derive_group";

// CanvasVoiceAudioBinding 角色绑定的音频（params.canvas.voiceAudio）
export type CanvasVoiceAudioBinding = {
    sourceAssetId: number;
    url: string;
};

// CanvasAudioCharacterBinding 音频节点绑定的角色记录（params.canvas.audioCharacterBinding）
export type CanvasAudioCharacterBinding = {
    mode: AudioCharacterBindingMode;
    characterAssetIds: number[];
    deriveId?: string | null;
};

// CanvasAssetParams 画布扩展数据（params.canvas）
export type CanvasAssetParams = {
    position?: CanvasPosition;
    textContent?: string;
    // appearanceName 角色形象名称（每个形象资产独立）
    appearanceName?: string;
    // characterName 已废弃：旧版角色名，请读 asset.name
    characterName?: string;
    // referenceSourceAssetId 引用创建时的直接来源资产 ID
    referenceSourceAssetId?: number;
    generation?: CanvasGenerationSettings;
    audioGeneration?: CanvasAudioGenerationSettings;
    voiceAudio?: CanvasVoiceAudioBinding;
    audioCharacterBinding?: CanvasAudioCharacterBinding;
    edges?: CanvasLayoutEdge[];
};

// AssetParams 资产 params 顶层结构
export type AssetParams = {
    [ASSET_PARAMS_CANVAS_KEY]?: CanvasAssetParams;
};

// SaveAssetParamsItem 批量保存 params 时的单条更新项
export type SaveAssetParamsItem = {
    asset_id: number;
    params: AssetParams;
};
