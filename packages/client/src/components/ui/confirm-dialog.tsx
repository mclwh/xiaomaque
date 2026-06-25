// 通用二次确认弹窗：取代各业务模块重复的确认/删除弹窗
import { Loader2 } from "lucide-react";
import { ModalShell } from "@/components/ui/modal-shell";
import { PillButton } from "@/components/ui/pill-button";

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel?: string;
    confirming?: boolean;
    variant?: "default" | "danger";
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
};

// 渲染通用二次确认弹窗
export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel = "取消",
    confirming = false,
    variant = "default",
    onClose,
    onConfirm,
}: ConfirmDialogProps) {
    return (
        <ModalShell open={open} onClose={onClose}>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

            <div className="mt-5 flex justify-end gap-2">
                <PillButton variant="outline" disabled={confirming} onClick={onClose}>
                    {cancelLabel}
                </PillButton>
                <PillButton
                    variant={variant === "danger" ? "danger" : "primary"}
                    disabled={confirming}
                    onClick={() => void onConfirm()}
                >
                    {confirming ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : null}
                    {confirmLabel}
                </PillButton>
            </div>
        </ModalShell>
    );
}
