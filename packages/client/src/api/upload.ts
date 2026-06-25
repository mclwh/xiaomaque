import { request } from "@/api/http";

// StorageCategory 资源分类
export type StorageCategory = "image" | "video" | "audio";

// QiniuUploadTokenResult 七牛上传凭证
export type QiniuUploadTokenResult = {
    token: string;
    key: string;
    objectKey: string;
    uploadUrl: string;
};

// FetchQiniuUploadTokenPayload 申请上传 token 请求体
export type FetchQiniuUploadTokenPayload = {
    category: StorageCategory;
    ext?: string;
};

// 申请七牛云上传 token
export function fetchQiniuUploadToken(payload: FetchQiniuUploadTokenPayload) {
    return request<QiniuUploadTokenResult>("/upload/qiniu_token", {
        method: "POST",
        data: payload,
    });
}

// UploadRemoteImagePayload 远程图片转存请求体
export type UploadRemoteImagePayload = {
    url: string;
    category?: StorageCategory;
};

// QiniuStoredObjectResult 转存后的存储 key
export type QiniuStoredObjectResult = {
    key: string;
};

// 触发七牛云从远程 URL 抓取图片（不经浏览器 fetch，规避 CORS）
export function fetchRemoteImageToQiniu(payload: UploadRemoteImagePayload) {
    return request<QiniuStoredObjectResult>("/upload/qiniu_from_url", {
        method: "POST",
        data: {
            category: "image",
            ...payload,
        },
    });
}
