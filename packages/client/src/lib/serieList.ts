import type { ProjectSerie } from "@/api/serie";

// 从分集列表移除已删除的分集
export function removeSeriesByIds(series: ProjectSerie[], deletedIds: number[]): ProjectSerie[] {
    if (deletedIds.length === 0) {
        return series;
    }

    // deletedIdSet 待移除的分集 ID 集合
    const deletedIdSet = new Set(deletedIds);

    return series.filter((item) => !deletedIdSet.has(item.id));
}

// 用更新后的分集替换列表中的对应项
export function upsertSerieInList(series: ProjectSerie[], updated: ProjectSerie): ProjectSerie[] {
    return series.map((item) => (item.id === updated.id ? updated : item));
}
