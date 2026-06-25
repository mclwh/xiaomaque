import type { ProjectSerie } from "@/api/serie";

// 格式化资产出现集数展示文案
export function formatAssetSerieEpisodeLabel(
    serieIds: number[] | undefined,
    series: ProjectSerie[],
) {
    if (!serieIds?.length) {
        return "未设置";
    }

    /*
     * labels 已选集数的展示名称
     * serieById 集数 ID 到对象的映射
     */
    const serieById = new Map(series.map((item) => [item.id, item]));
    const labels = serieIds
        .map((serieId) => serieById.get(serieId)?.name?.trim())
        .filter((name): name is string => Boolean(name));

    if (labels.length === 0) {
        return "未设置";
    }

    return labels.join("、");
}
