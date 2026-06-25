// 允许服务端代传的远程媒体域名后缀（防止 SSRF）
const ALLOWED_REMOTE_HOST_SUFFIXES = [".volces.com", ".volcengineapi.com"];

// 根据 Content-Type 或 URL 推断远程文件扩展名
export function inferRemoteFileExt(contentType: string | null, remoteUrl: string): string {
    const normalizedType = contentType?.toLowerCase() ?? "";

    if (normalizedType.includes("mp4")) {
        return "mp4";
    }

    if (normalizedType.includes("png")) {
        return "png";
    }

    if (normalizedType.includes("webp")) {
        return "webp";
    }

    if (normalizedType.includes("jpeg") || normalizedType.includes("jpg")) {
        return "jpg";
    }

    const pathname = new URL(remoteUrl).pathname.toLowerCase();

    if (pathname.endsWith(".mp4")) {
        return "mp4";
    }

    if (pathname.endsWith(".png")) {
        return "png";
    }

    if (pathname.endsWith(".webp")) {
        return "webp";
    }

    if (pathname.endsWith(".jpeg") || pathname.endsWith(".jpg")) {
        return "jpg";
    }

    return "jpg";
}

// 校验远程媒体 URL 是否在白名单内
export function assertAllowedRemoteMediaUrl(remoteUrl: string) {
    let parsedUrl: URL;

    try {
        parsedUrl = new URL(remoteUrl);
    } catch {
        throw new Error("媒体地址无效");
    }

    if (parsedUrl.protocol !== "https:") {
        throw new Error("仅支持 HTTPS 媒体地址");
    }

    const allowed = ALLOWED_REMOTE_HOST_SUFFIXES.some((suffix) =>
        parsedUrl.hostname.endsWith(suffix),
    );

    if (!allowed) {
        throw new Error("不允许的媒体地址");
    }
}
