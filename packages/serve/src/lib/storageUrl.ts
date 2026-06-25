import { QiniuService } from "../services/qiniu.js";

// qiniuService 七牛服务单例，用于生成私有空间下载签名 URL
const qiniuService = new QiniuService();

// 将资产存储 key 解析为可访问 URL（私有空间返回带 e/token 的完整签名地址）
export function resolveAssetMediaUrl(key: string | null): string | null {
    return qiniuService.resolvePrivateDownloadUrl(key);
}
