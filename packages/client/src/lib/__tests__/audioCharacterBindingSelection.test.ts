import { describe, expect, it } from "vitest";
import type { ProjectAsset } from "@/api/asset";
import type { ProjectAssetDisplayGroup } from "@/lib/projectAssetGroups";
import {
    buildDefaultExpandedGroupKeys,
    getCheckboxState,
    resolveCharacterBindingSubmit,
    toggleSelection,
} from "@/lib/audioCharacterBindingSelection";

function createAsset(id: number, deriveId: string | null = null): ProjectAsset {
    return {
        id,
        type: "character",
        assetType: "image",
        name: `角色${id}`,
        cover: null,
        url: null,
        params: null,
        projectId: 1,
        deriveId,
        serieIds: [],
        createdAt: "",
        updatedAt: "",
    };
}

function createGroup(
    key: string,
    deriveId: string | null,
    assetIds: number[],
): ProjectAssetDisplayGroup {
    const assets = assetIds.map((id) => createAsset(id, deriveId));

    return {
        key,
        deriveId,
        assets,
        representativeAsset: assets[0],
        totalCount: assets.length,
        pendingCount: assets.length,
    };
}

describe("audioCharacterBindingSelection", () => {
    it("getCheckboxState 支持全选、部分选、未选", () => {
        const selected = new Set([1, 2]);

        expect(getCheckboxState(selected, [1, 2, 3])).toBe("indeterminate");
        expect(getCheckboxState(selected, [1, 2])).toBe("checked");
        expect(getCheckboxState(selected, [3])).toBe("unchecked");
    });

    it("toggleSelection 在全选与全不选之间切换", () => {
        const selected = new Set<number>([1]);

        expect(toggleSelection(selected, [1, 2, 3])).toEqual(new Set([1, 2, 3]));
        expect(toggleSelection(new Set([1, 2, 3]), [1, 2, 3])).toEqual(new Set());
    });

    it("resolveCharacterBindingSubmit 识别 derive 全组绑定", () => {
        const groups = [createGroup("g1", "abc", [1, 2, 3])];

        expect(resolveCharacterBindingSubmit([2], groups)).toEqual({
            characterAssetIds: [2],
            bindMode: "single",
            deriveId: null,
        });

        expect(resolveCharacterBindingSubmit([1, 2, 3], groups)).toEqual({
            characterAssetIds: [1, 2, 3],
            bindMode: "derive_group",
            deriveId: "abc",
        });

        expect(resolveCharacterBindingSubmit([1, 2], groups)).toEqual({
            characterAssetIds: [1, 2],
            bindMode: "single",
            deriveId: null,
        });
    });

    it("buildDefaultExpandedGroupKeys 仅展开多形象分组", () => {
        const groups = [
            createGroup("single", null, [1]),
            createGroup("multi", "abc", [2, 3]),
        ];

        expect(buildDefaultExpandedGroupKeys(groups)).toEqual(new Set(["multi"]));
    });
});
