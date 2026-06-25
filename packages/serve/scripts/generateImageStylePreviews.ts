// 批量生成各图片风格预览图并写入 client/public/image-styles
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IMAGE_STYLE_IDS } from "../src/lib/imageStyles.js";
import { resolveImageStylePrompt } from "../src/lib/imageStyles.js";
import { SeedreamImageService } from "../src/services/seedream.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// PREVIEW_SCENE_PREFIX 预览图统一场景前缀
const PREVIEW_SCENE_PREFIX =
    "电影场景单帧预览，开阔构图，无人物面部特写，无文字无水印，高质量细节，";

// 下载远程图片并保存到本地
async function downloadImage(url: string, filePath: string) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`下载预览图失败（HTTP ${response.status}）`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(filePath, buffer);
}

// 为全部风格生成预览图
async function main() {
    const outputDir = path.resolve(__dirname, "../../client/public/image-styles");
    await fs.mkdir(outputDir, { recursive: true });

    const seedream = new SeedreamImageService();

    for (const styleId of IMAGE_STYLE_IDS) {
        const outputPath = path.join(outputDir, `${styleId}.jpg`);

        try {
            await fs.access(outputPath);
            console.log(`[skip] ${styleId} 已存在`);
            continue;
        } catch {
            // 文件不存在，继续生成
        }

        const stylePrompt = resolveImageStylePrompt(styleId);
        const prompt = `${PREVIEW_SCENE_PREFIX}${stylePrompt}`;

        console.log(`[generate] ${styleId}...`);

        const result = await seedream.generateImage({
            prompt,
            modelId: "seedream-4.5",
            aspectRatio: "4:3",
            resolution: "3K",
        });

        const imageUrl = result.images[0]?.url;

        if (!imageUrl) {
            throw new Error(`${styleId} 未返回图片 URL`);
        }

        await downloadImage(imageUrl, outputPath);
        console.log(`[done] ${styleId}`);
    }

    console.log("全部风格预览图生成完成");
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
