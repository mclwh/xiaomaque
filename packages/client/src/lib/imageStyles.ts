// IMAGE_STYLE_IDS 图片风格 ID 列表（与后端 imageStyles.ts 保持一致）
export const IMAGE_STYLE_IDS = [
    "retro-sci-fi-atompunk",
    "palace-intrigue-cold",
    "domestic-suspense-cold",
    "ancient-romance-soft",
    "japanese-youth-film",
    "japanese-daily-natural",
    "korean-urban-soft",
    "chinese-urban-realistic",
    "wuxia-realistic-photo",
    "90s-realistic-film",
    "retro-narrative-film",
    "american-retro-hollywood",
    "neon-cyberpunk-film",
    "90s-rural-china-film",
    "tezuka-era-cartoon",
    "shanghai-animation",
    "pixel-art",
    "shadow-puppet-illustration",
] as const;

export type ImageStyleId = (typeof IMAGE_STYLE_IDS)[number];

// IMAGE_STYLE_OPTIONS 画布风格选择器选项
export const IMAGE_STYLE_OPTIONS: Array<{ id: ImageStyleId; label: string }> = [
    { id: "retro-sci-fi-atompunk", label: "复古科幻原子朋克" },
    { id: "palace-intrigue-cold", label: "宫斗权谋冷峻" },
    { id: "domestic-suspense-cold", label: "国产悬疑冷调" },
    { id: "ancient-romance-soft", label: "古偶唯美柔光" },
    { id: "japanese-youth-film", label: "日式青春胶片" },
    { id: "japanese-daily-natural", label: "日式生活自然" },
    { id: "korean-urban-soft", label: "韩剧都市柔光" },
    { id: "chinese-urban-realistic", label: "国产都市写实" },
    { id: "wuxia-realistic-photo", label: "武侠江湖写实摄影" },
    { id: "90s-realistic-film", label: "90年代写实电影" },
    { id: "retro-narrative-film", label: "复古叙事电影" },
    { id: "american-retro-hollywood", label: "美式复古好莱坞" },
    { id: "neon-cyberpunk-film", label: "霓虹赛博电影" },
    { id: "90s-rural-china-film", label: "90年代中国农村电影" },
    { id: "tezuka-era-cartoon", label: "手冢治虫时代卡通画风" },
    { id: "shanghai-animation", label: "上美画风" },
    { id: "pixel-art", label: "像素风" },
    { id: "shadow-puppet-illustration", label: "皮影戏插画" },
];

// 解析已保存的风格 ID，无效时返回 undefined
export function resolveSavedImageStyleId(styleId: string | undefined): ImageStyleId | undefined {
    if (!styleId) {
        return undefined;
    }

    return IMAGE_STYLE_IDS.includes(styleId as ImageStyleId)
        ? (styleId as ImageStyleId)
        : undefined;
}

// 根据风格 ID 返回展示名称
export function getImageStyleLabel(styleId: ImageStyleId | undefined): string | null {
    if (!styleId) {
        return null;
    }

    return IMAGE_STYLE_OPTIONS.find((option) => option.id === styleId)?.label ?? null;
}
