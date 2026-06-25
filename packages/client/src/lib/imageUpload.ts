// 图片上传校验与扩展名推断

// IMAGE_MAX_FILE_SIZE 允许上传的最大图片体积（20MB）
export const IMAGE_MAX_FILE_SIZE = 20 * 1024 * 1024;

// 校验图片文件类型与体积
export function isValidImageFile(file: File) {
    return file.type.startsWith("image/") && file.size > 0 && file.size <= IMAGE_MAX_FILE_SIZE;
}

// 从文件名推断图片扩展名
export function inferImageExtFromFilename(filename: string) {
    const ext = filename.split(".").pop()?.toLowerCase();

    if (ext && /^[a-z0-9]+$/.test(ext)) {
        return ext;
    }

    return "jpg";
}
