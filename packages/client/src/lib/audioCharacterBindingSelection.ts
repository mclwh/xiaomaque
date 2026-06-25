import type { ProjectAssetDisplayGroup } from "@/lib/projectAssetGroups";
import type { AudioCharacterBindingMode } from "@/types/assetParams";

// CheckboxState 树形多选勾选状态
export type CheckboxState = "checked" | "unchecked" | "indeterminate";

// 收集所有可绑定的角色资产 ID
export function getAllCharacterAssetIds(groups: ProjectAssetDisplayGroup[]) {
    return groups.flatMap((group) => group.assets.map((asset) => asset.id));
}

// 收集分组内全部角色资产 ID
export function getGroupCharacterAssetIds(group: ProjectAssetDisplayGroup) {
    return group.assets.map((asset) => asset.id);
}

// 计算一组 ID 在当前选中集合中的勾选状态
export function getCheckboxState(selectedIds: Set<number>, targetIds: number[]): CheckboxState {
    if (targetIds.length === 0) {
        return "unchecked";
    }

    const selectedCount = targetIds.filter((id) => selectedIds.has(id)).length;

    if (selectedCount === 0) {
        return "unchecked";
    }

    if (selectedCount === targetIds.length) {
        return "checked";
    }

    return "indeterminate";
}

// 切换一组 ID 的选中状态（全选 ↔ 全不选）
export function toggleSelection(selectedIds: Set<number>, targetIds: number[]) {
    const next = new Set(selectedIds);
    const state = getCheckboxState(selectedIds, targetIds);

    if (state === "checked") {
        for (const id of targetIds) {
            next.delete(id);
        }
    } else {
        for (const id of targetIds) {
            next.add(id);
        }
    }

    return next;
}

// 解析提交绑定时的模式与 derive_id
export function resolveCharacterBindingSubmit(
    selectedIds: number[],
    groups: ProjectAssetDisplayGroup[],
): {
    characterAssetIds: number[];
    bindMode: AudioCharacterBindingMode;
    deriveId: string | null;
} {
    if (selectedIds.length === 0) {
        throw new Error("请选择要绑定的角色");
    }

    if (selectedIds.length === 1) {
        return {
            characterAssetIds: selectedIds,
            bindMode: "single",
            deriveId: null,
        };
    }

    for (const group of groups) {
        if (!group.deriveId || group.totalCount <= 1) {
            continue;
        }

        const groupIds = getGroupCharacterAssetIds(group);
        const isFullGroup =
            selectedIds.length === groupIds.length &&
            groupIds.every((id) => selectedIds.includes(id));

        if (isFullGroup) {
            return {
                characterAssetIds: selectedIds,
                bindMode: "derive_group",
                deriveId: group.deriveId,
            };
        }
    }

    return {
        characterAssetIds: selectedIds,
        bindMode: "single",
        deriveId: null,
    };
}

// 构建默认展开的分组 key（多形象组默认展开）
export function buildDefaultExpandedGroupKeys(groups: ProjectAssetDisplayGroup[]) {
    return new Set(groups.filter((group) => group.totalCount > 1).map((group) => group.key));
}
