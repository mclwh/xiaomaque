// 资产库多选底部操作栏
import { Loader2, Trash2 } from "lucide-react";

type AssetLibrarySelectionBarProps = {
    selectedCount: number;
    deleting?: boolean;
    onClearSelection: () => void;
    onDelete: () => void;
};

// 渲染资产库多选底部操作栏
export function AssetLibrarySelectionBar({
    selectedCount,
    deleting = false,
    onClearSelection,
    onDelete,
}: AssetLibrarySelectionBarProps) {
    if (selectedCount <= 0) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
            <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-black px-5 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.28)]">
                <span className="text-sm text-white">已选择 {selectedCount} 项资产</span>
                <button
                    type="button"
                    disabled={deleting}
                    className="inline-flex cursor-pointer items-center rounded-full bg-white px-4 py-1.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={onClearSelection}
                >
                    取消选择
                </button>
                <button
                    type="button"
                    disabled={deleting}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#ff6b6b] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#ff5a5a] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={onDelete}
                >
                    {deleting ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : null}
                    <Trash2 className="size-4" strokeWidth={1.8} />
                    删除
                </button>
            </div>
        </div>
    );
}
