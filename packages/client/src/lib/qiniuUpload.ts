// 上传文件到七牛云
export async function uploadFileToQiniu(payload: {
    uploadUrl: string;
    token: string;
    objectKey: string;
    file: Blob;
}) {
    const formData = new FormData();
    formData.append("token", payload.token);
    formData.append("key", payload.objectKey);
    formData.append("file", payload.file);

    const response = await fetch(payload.uploadUrl, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || "七牛云上传失败");
    }
}
