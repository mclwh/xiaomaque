import crypto from "crypto";
import { env } from "../config/env.js";
import {
    assertAllowedRemoteMediaUrl,
    inferRemoteFileExt,
} from "../lib/remoteMedia.js";
import {
    buildStorageKey,
    toObjectKey,
    type StorageCategory,
} from "../lib/storagePath.js";

// QiniuUploadTokenResult 上传凭证响应
export type QiniuUploadTokenResult = {
    token: string;
    key: string;
    objectKey: string;
    uploadUrl: string;
};

// QiniuStoredObjectResult 上传完成后的存储 key
export type QiniuStoredObjectResult = {
    key: string;
};

/**
 * 七牛云上传服务：生成带固定前缀 scope 的上传 token
 */
export class QiniuService {
    // 校验七牛配置是否完整
    private assertConfig() {
        if (!env.QINIU_ACCESS_KEY || !env.QINIU_SECRET_KEY || !env.QINIU_BUCKET) {
            throw new Error("未配置七牛云上传凭证");
        }
    }

    // URL 安全的 Base64 编码
    private urlSafeBase64Encode(content: string): string {
        return Buffer.from(content, "utf8")
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
    }

    // 生成上传 token 签名
    private signUploadToken(objectKey: string, expiresInSeconds: number): string {
        const deadline = Math.floor(Date.now() / 1000) + expiresInSeconds;
        const putPolicy = JSON.stringify({
            scope: `${env.QINIU_BUCKET}:${objectKey}`,
            deadline,
        });
        const encodedPutPolicy = this.urlSafeBase64Encode(putPolicy);
        const sign = crypto
            .createHmac("sha1", env.QINIU_SECRET_KEY!)
            .update(encodedPutPolicy)
            .digest("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");

        return `${env.QINIU_ACCESS_KEY}:${sign}:${encodedPutPolicy}`;
    }

    // 生成私有空间下载签名（accessKey:urlSafeBase64(hmac-sha1(secret, url?e=deadline))）
    private signPrivateDownloadUrl(urlToSign: string): string {
        const sign = crypto
            .createHmac("sha1", env.QINIU_SECRET_KEY!)
            .update(urlToSign)
            .digest("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");

        return `${env.QINIU_ACCESS_KEY}:${sign}`;
    }

    // 将存储 key 转为私有空间可访问的完整签名 URL
    createPrivateDownloadUrl(storageKey: string): string {
        this.assertConfig();

        if (!env.QINIU_CDN_BASE_URL) {
            throw new Error("未配置七牛 CDN 域名");
        }

        if (/^https?:\/\//i.test(storageKey)) {
            return storageKey;
        }

        const cdnBase = env.QINIU_CDN_BASE_URL.replace(/\/$/, "");
        const objectPath = storageKey.startsWith("/") ? storageKey : `/${storageKey}`;
        const deadline = Math.floor(Date.now() / 1000) + env.QINIU_DOWNLOAD_EXPIRES_IN;
        const urlToSign = `${cdnBase}${objectPath}?e=${deadline}`;
        const token = this.signPrivateDownloadUrl(urlToSign);

        return `${urlToSign}&token=${token}`;
    }

    // 安全解析存储 key：无 key 返回 null，未配置七牛时原样返回 key
    resolvePrivateDownloadUrl(storageKey: string | null): string | null {
        if (!storageKey) {
            return null;
        }

        if (/^https?:\/\//i.test(storageKey)) {
            return storageKey;
        }

        if (!env.QINIU_ACCESS_KEY || !env.QINIU_SECRET_KEY || !env.QINIU_CDN_BASE_URL) {
            return storageKey;
        }

        return this.createPrivateDownloadUrl(storageKey);
    }

    // 生成 QBox 管理凭证（用于资源抓取等管理 API）
    private signManagementToken(path: string): string {
        const sign = crypto
            .createHmac("sha1", env.QINIU_SECRET_KEY!)
            .update(`${path}\n`)
            .digest("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");

        return `${env.QINIU_ACCESS_KEY}:${sign}`;
    }

    // 申请指定分类的上传 token 与存储 key
    createUploadToken(category: StorageCategory, ext = "png"): QiniuUploadTokenResult {
        this.assertConfig();

        const key = buildStorageKey(category, ext);
        const objectKey = toObjectKey(key);
        const token = this.signUploadToken(objectKey, env.QINIU_TOKEN_EXPIRES_IN);

        return {
            token,
            key,
            objectKey,
            uploadUrl: env.QINIU_UPLOAD_URL,
        };
    }

    // 将二进制内容上传到七牛云
    async uploadBuffer(
        category: StorageCategory,
        buffer: Buffer,
        ext: string,
        mimeType?: string,
    ): Promise<QiniuStoredObjectResult> {
        this.assertConfig();

        const credential = this.createUploadToken(category, ext);
        const formData = new FormData();
        formData.append("token", credential.token);
        formData.append("key", credential.objectKey);
        formData.append(
            "file",
            new Blob([new Uint8Array(buffer)], { type: mimeType ?? "application/octet-stream" }),
            `upload.${ext}`,
        );

        const uploadResponse = await fetch(credential.uploadUrl, {
            method: "POST",
            body: formData,
        });

        if (!uploadResponse.ok) {
            const message = await uploadResponse.text().catch(() => "");
            throw new Error(message || "七牛云上传失败");
        }

        return { key: credential.key };
    }

    // 触发七牛云从远程 URL 抓取资源（图片不经由业务服务器中转）
    async fetchFromRemoteUrl(
        remoteUrl: string,
        category: StorageCategory,
    ): Promise<QiniuStoredObjectResult> {
        assertAllowedRemoteMediaUrl(remoteUrl);
        this.assertConfig();

        const ext = inferRemoteFileExt(null, remoteUrl);
        const key = buildStorageKey(category, ext);
        const objectKey = toObjectKey(key);
        const entry = `${env.QINIU_BUCKET}:${objectKey}`;
        const fetchPath = `/fetch/${this.urlSafeBase64Encode(remoteUrl)}/to/${this.urlSafeBase64Encode(entry)}`;
        const fetchEndpoint = `${env.QINIU_IOVIP_URL}${fetchPath}`;
        const accessToken = this.signManagementToken(fetchPath);

        const response = await fetch(fetchEndpoint, {
            method: "POST",
            headers: {
                Authorization: `QBox ${accessToken}`,
            },
        });

        const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;

        if (!response.ok) {
            throw new Error(payload?.error || "七牛云抓取远程图片失败");
        }

        return { key };
    }

    // 下载远程图片并上传到七牛云（服务端代传，高流量场景不推荐）
    async uploadFromRemoteUrl(
        remoteUrl: string,
        category: StorageCategory,
    ): Promise<QiniuStoredObjectResult> {
        assertAllowedRemoteMediaUrl(remoteUrl);

        const response = await fetch(remoteUrl);

        if (!response.ok) {
            throw new Error("下载远程图片失败");
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const ext = inferRemoteFileExt(response.headers.get("content-type"), remoteUrl);

        return this.uploadBuffer(
            category,
            buffer,
            ext,
            response.headers.get("content-type") ?? undefined,
        );
    }
}

// qiniuService 七牛云上传服务单例
export const qiniuService = new QiniuService();
