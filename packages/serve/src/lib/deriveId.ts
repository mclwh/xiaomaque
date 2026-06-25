// deriveId 字符集（大小写字母与数字）
const DERIVE_ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

// deriveId 合法格式（10 位字母数字）
export const DERIVE_ID_PATTERN = /^[A-Za-z0-9]{10}$/;

// 生成随机 10 位 derive_id
export function generateDeriveId(): string {
    let result = "";

    for (let index = 0; index < 10; index += 1) {
        const charIndex = Math.floor(Math.random() * DERIVE_ID_CHARS.length);
        result += DERIVE_ID_CHARS[charIndex];
    }

    return result;
}
