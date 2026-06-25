// 分集编辑页：资产预览层（图片 / 视频 / 音频）
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import type { ProjectAsset } from "@/api/asset";
import { MediaAudioPlayer } from "@/components/ui/media-audio-player";
import { MediaImagePreview } from "@/components/ui/media-image-preview";
import { resolveStoragePreviewUrl, resolveStorageUrl } from "@/lib/storageUrl";

type EpisodeEditAssetPreviewProps = {
    asset: ProjectAsset | null;
    title: string;
    onClose: () => void;
};

// 解析资产可预览的媒体地址
export function resolveEpisodeAssetPreviewUrl(asset: ProjectAsset): string | null {
    if (asset.assetType === "audio" || asset.assetType === "video") {
        return resolveStorageUrl(asset.url ?? asset.cover);
    }

    return resolveStoragePreviewUrl(asset.url ?? asset.cover);
}

// 渲染分集编辑页资产预览
export function EpisodeEditAssetPreview({ asset, title, onClose }: EpisodeEditAssetPreviewProps) {
    if (!asset) {
        return null;
    }

    const previewUrl = resolveEpisodeAssetPreviewUrl(asset);

    if (!previewUrl) {
        return null;
    }

    if (asset.assetType === "audio") {
        return createPortal(
            <div
                className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
                onClick={onClose}
            >
                <div
                    className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-xl"
                    onClick={(event) => event.stopPropagation()}
                >
                    <button
                        type="button"
                        aria-label="关闭预览"
                        className="absolute top-3 right-3 inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        onClick={onClose}
                    >
                        <X className="size-4" strokeWidth={2} />
                    </button>
                    <p className="mb-3 truncate pr-10 text-sm font-medium text-slate-800">{title}</p>
                    <MediaAudioPlayer src={previewUrl} />
                </div>
            </div>,
            document.body,
        );
    }

    if (asset.assetType === "video") {
        return createPortal(
            <div
                className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
                onClick={onClose}
            >
                <div
                    className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-end gap-3"
                    onClick={(event) => event.stopPropagation()}
                >
                    <button
                        type="button"
                        aria-label="关闭预览"
                        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                        onClick={onClose}
                    >
                        <X className="size-4" strokeWidth={2} />
                    </button>
                    <video
                        src={previewUrl}
                        controls
                        playsInline
                        className="max-h-[calc(90vh-3rem)] max-w-full rounded-xl bg-black"
                    />
                </div>
            </div>,
            document.body,
        );
    }

    return <MediaImagePreview open src={previewUrl} alt={title} onClose={onClose} />;
}
