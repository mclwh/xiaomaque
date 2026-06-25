// 画布待删除资产 ID 队列工具函数

// mergePendingDeleteAssetIds 合并待删除 ID 并去重
export function mergePendingDeleteAssetIds(current: number[], incoming: number[]): number[] {
    return [...new Set([...current, ...incoming])];
}
