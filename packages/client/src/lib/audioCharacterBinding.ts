import type { ProjectAsset } from "@/api/asset";
import {
    groupProjectAssetsForDisplay,
    type ProjectAssetDisplayGroup,
} from "@/lib/projectAssetGroups";

// 从项目资产中筛选角色并按 derive_id 分组，供音频绑定选择
export function buildCharacterBindingGroups(assets: ProjectAsset[]): ProjectAssetDisplayGroup[] {
    const characters = assets.filter((asset) => asset.type === "character");

    return groupProjectAssetsForDisplay(characters);
}

// 解析分组内要绑定的单个角色资产 ID（默认取代表形象）
export function resolveSingleCharacterAssetId(group: ProjectAssetDisplayGroup) {
    return group.representativeAsset.id;
}

// 解析分组内要绑定的全部角色资产 ID（同 derive_id 组内所有形象）
export function resolveGroupCharacterAssetIds(group: ProjectAssetDisplayGroup) {
    return group.assets.map((asset) => asset.id);
}
