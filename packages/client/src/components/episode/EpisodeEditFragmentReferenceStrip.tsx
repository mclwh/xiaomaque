// 分集编辑页：分镜引用资产缩略图条
import { Image as ImageIcon } from "lucide-react";
import { useMemo } from "react";
import type { ProjectAsset } from "@/api/asset";
import { buildEpisodeFragmentReferenceStripItems } from "@/lib/episodeFragmentReferenceStrip";

type EpisodeEditFragmentReferenceStripProps = {
    references: unknown[];
    assets: ProjectAsset[];
};

// 渲染当前分镜已引用资产缩略图条
export function EpisodeEditFragmentReferenceStrip({
    references,
    assets,
}: EpisodeEditFragmentReferenceStripProps) {
    const items = useMemo(
        () => buildEpisodeFragmentReferenceStripItems(references, assets),
        [assets, references],
    );

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {items.map((item) => (
                <div
                    key={item.assetId}
                    title={item.label}
                    className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-[#efeff4] ring-1 ring-black/5"
                >
                    {item.previewUrl ? (
                        <img
                            src={item.previewUrl}
                            alt={item.label}
                            className="size-full object-cover"
                            draggable={false}
                            loading="lazy"
                            decoding="async"
                        />
                    ) : (
                        <div className="flex size-full items-center justify-center">
                            <ImageIcon className="size-5 text-slate-300" strokeWidth={1.5} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
