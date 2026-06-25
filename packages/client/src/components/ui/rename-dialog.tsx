// 通用重命名弹窗：取代短剧项目/分集等重复的重命名弹窗
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { PillButton } from "@/components/ui/pill-button";

type RenameDialogProps = {
    open: boolean;
    title: string;
    description: string;
    inputLabel: string;
    initialValue: string;
    saving?: boolean;
    maxLength?: number;
    confirmLabel?: string;
    onClose: () => void;
    onSubmit: (value: string) => void | Promise<void>;
};

// 渲染通用重命名弹窗
export function RenameDialog({
    open,
    title,
    description,
    inputLabel,
    initialValue,
    saving = false,
    maxLength = 100,
    confirmLabel = "保存",
    onClose,
    onSubmit,
}: RenameDialogProps) {
    // value 输入框中的名称
    const [value, setValue] = useState("");

    useEffect(() => {
        if (!open) {
            return;
        }

        setValue(initialValue);
    }, [open, initialValue]);

    // 提交重命名
    const handleSubmit = useCallback(() => {
        if (!value.trim() || saving) {
            return;
        }

        void onSubmit(value.trim());
    }, [onSubmit, saving, value]);

    return (
        <ModalShell open={open} onClose={onClose}>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>

            <label className="mt-4 block">
                <span className="mb-1.5 block text-xs text-slate-500">{inputLabel}</span>
                <input
                    type="text"
                    value={value}
                    maxLength={maxLength}
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60"
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            handleSubmit();
                        }
                    }}
                />
            </label>

            <div className="mt-5 flex justify-end gap-2">
                <PillButton variant="outline" disabled={saving} onClick={onClose}>
                    取消
                </PillButton>
                <PillButton disabled={saving || !value.trim()} onClick={handleSubmit}>
                    {saving ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : null}
                    {confirmLabel}
                </PillButton>
            </div>
        </ModalShell>
    );
}
