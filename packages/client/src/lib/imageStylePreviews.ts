import type { ImageStyleId } from "@/lib/imageStyles";

// IMAGE_STYLE_PREVIEW_BASE 风格预览图静态资源路径前缀
const IMAGE_STYLE_PREVIEW_BASE = "/image-styles";

// 返回风格预览图 URL（对应 public/image-styles/{id}.jpg）
export function getImageStylePreviewUrl(styleId: ImageStyleId): string {
    return `${IMAGE_STYLE_PREVIEW_BASE}/${styleId}.jpg`;
}
