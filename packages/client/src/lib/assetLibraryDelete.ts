import { batchDeleteAssets } from "@/api/asset";
import type { ProjectAssetDisplayGroup } from "@/lib/projectAssetGroups";

// 按项目分组批量删除资产库选中项
export async function deleteLibraryAssetGroups(groups: ProjectAssetDisplayGroup[]) {
    const assetIdsByProject = new Map<number, number[]>();

    for (const group of groups) {
        for (const asset of group.assets) {
            const assetIds = assetIdsByProject.get(asset.projectId) ?? [];
            assetIds.push(asset.id);
            assetIdsByProject.set(asset.projectId, assetIds);
        }
    }

    await Promise.all(
        [...assetIdsByProject.entries()].map(([projectId, assetIds]) =>
            batchDeleteAssets({
                project_id: projectId,
                asset_ids: assetIds,
            }),
        ),
    );
}
