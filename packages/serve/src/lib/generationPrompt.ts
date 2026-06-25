import { ASSET_CATEGORY_TYPES } from "./assetCategory.js";
import { resolveImageStylePrompt, type ImageStyleId } from "./imageStyles.js";

// GENERATION_PROMPT_ASSET_TYPES 生图时可传入的资产分类类型
export const GENERATION_PROMPT_ASSET_TYPES = ASSET_CATEGORY_TYPES;

export type GenerationPromptAssetType = (typeof GENERATION_PROMPT_ASSET_TYPES)[number];

// CHARACTER_PROMPT_PREFIX 角色节点默认提示词前缀
const CHARACTER_PROMPT_PREFIX =
    "【强制任务：生成白底人物角色全身照】本次必须生成纯白背景、以人物为主体的全身角色形象，人物从头到脚完整入镜，必须是画面绝对主角并占据主要视觉面积，背景保持干净简洁的纯白色且无多余元素。严禁生成半身照、特写、大头照、肖像、纯风景、空镜、道具特写、文字海报、抽象图案、复杂背景或无人物主体的画面。即使用户描述偏向场景、物品或动作片段，也必须转化为可辨识的白底全身人物角色来呈现，并据此补全外貌、体态、服饰与神态。请严格依据以下用户描述生成白底人物角色全身照：";

// SCENE_PROMPT_PREFIX 场景节点默认提示词前缀
const SCENE_PROMPT_PREFIX =
    "【强制任务：生成场景画面】本次必须生成以环境空间为主体的场景画面，建筑、地貌、室内外空间或氛围环境必须是画面绝对主角。严禁生成人物特写、角色立绘、肖像、以人物为视觉中心或人物占据画面主体的构图。即使用户描述涉及人物、角色或动作，也必须剥离人物主体，仅保留并扩展为可独立成立的环境场景。请严格依据以下用户描述生成场景画面：";

// 拼接风格提示词片段
function appendStylePrompt(prompt: string, styleId?: ImageStyleId): string {
    const stylePrompt = resolveImageStylePrompt(styleId);

    if (!stylePrompt) {
        return prompt;
    }

    return `${prompt}。画面风格要求：${stylePrompt}`;
}

// 根据资产分类类型与风格 ID 拼接完整生图提示词
export function buildGenerationPrompt(
    userPrompt: string,
    assetType?: GenerationPromptAssetType,
    styleId?: ImageStyleId,
): string {
    const trimmedPrompt = userPrompt.trim();
    let prompt = trimmedPrompt;

    if (assetType === "character") {
        prompt = `${CHARACTER_PROMPT_PREFIX}${trimmedPrompt}`;
    } else if (assetType === "scene") {
        prompt = `${SCENE_PROMPT_PREFIX}${trimmedPrompt}`;
    }

    return appendStylePrompt(prompt, styleId);
}
