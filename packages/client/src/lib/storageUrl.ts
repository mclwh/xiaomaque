// CDN_BASE 七牛 CDN 域名（不含末尾斜杠）；私有空间优先使用接口返回的已签名完整 URL
const CDN_BASE =
    (import.meta.env.VITE_CDN_BASE_URL as string | undefined)?.replace(/\/$/, "");

// QINIU_PREVIEW_DEFAULT_MAX_WIDTH 预览图最大宽度（imageView2 mode=2）
const QINIU_PREVIEW_DEFAULT_MAX_WIDTH = 1920;

// QINIU_PREVIEW_DEFAULT_QUALITY 预览图质量（imageView2 q 参数，1-100）
const QINIU_PREVIEW_DEFAULT_QUALITY = 75;

// IMAGE_STORAGE_EXT_PATTERN 可识别的图片存储路径扩展名
const IMAGE_STORAGE_EXT_PATTERN =
    /\.(avif|bmp|gif|heic|jpe?g|png|tiff|webp)(\?|#|$)/i;

// QiniuImagePreviewOptions 七牛 imageView2 预览参数
export type QiniuImagePreviewOptions = {
    maxWidth?: number;
    quality?: number;
};

// 去掉 URL 中的 query 与 hash，用于判断扩展名
function stripUrlQueryAndHash(url: string) {
    return url.split(/[?#]/)[0] ?? url;
}

// 判断存储 key 或 URL 是否可能为图片
export function isLikelyImageStoragePath(pathOrUrl: string) {
    return IMAGE_STORAGE_EXT_PATTERN.test(stripUrlQueryAndHash(pathOrUrl));
}

// 为七牛图片 URL 追加 imageView2 预览处理参数
export function appendQiniuImagePreviewProcessing(
    url: string,
    options?: QiniuImagePreviewOptions,
) {
    if (!isLikelyImageStoragePath(url)) {
        return url;
    }

    if (/imageView2\//i.test(url)) {
        return url;
    }

    const maxWidth = options?.maxWidth ?? QINIU_PREVIEW_DEFAULT_MAX_WIDTH;
    const quality = options?.quality ?? QINIU_PREVIEW_DEFAULT_QUALITY;
    const processing = `imageView2/2/w/${maxWidth}/q/${quality}`;
    const separator = url.includes("?") ? "&" : "?";

    return `${url}${separator}${processing}`;
}

// 将存储 key 或已签名 URL 解析为可访问地址（http(s) 开头则原样使用）
export function resolveStorageUrl(key: string | null | undefined): string | null {
    if (!key) {
        return null;
    }

    if (/^https?:\/\//i.test(key)) {
        return key;
    }

    if (!CDN_BASE) {
        return key;
    }

    return `${CDN_BASE}${key.startsWith("/") ? key : `/${key}`}`;
}

// 解析存储地址并附加七牛 imageView2 预览参数（非图片则与 resolveStorageUrl 一致）
export function resolveStoragePreviewUrl(
    key: string | null | undefined,
    options?: QiniuImagePreviewOptions,
): string | null {
    const url = resolveStorageUrl(key);

    if (!url) {
        return null;
    }

    return appendQiniuImagePreviewProcessing(url, options);
}

// 根据 Blob MIME 推断文件扩展名
export function inferFileExtFromBlob(blob: Blob): string {
    if (blob.type.includes("png")) {
        return "png";
    }

    if (blob.type.includes("webp")) {
        return "webp";
    }

    if (blob.type.includes("jpeg") || blob.type.includes("jpg")) {
        return "jpg";
    }

    return "jpg";
}

// 将 Base64 字符串转为 Blob（支持带 data URI 前缀）
export function base64ToBlob(base64: string, mimeType = "image/jpeg"): Blob {
    const normalized = base64.replace(/^data:image\/[\w+.-]+;base64,/, "");
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }

    return new Blob([bytes], { type: mimeType });
}
