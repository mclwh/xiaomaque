// 顶栏 ARK API Key 设置弹窗：本地保存并随请求发送给服务端
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { clearArkApiKey, loadArkApiKey, saveArkApiKey } from "@/lib/arkApiKeyStorage";

type ArkApiKeySettingsDialogProps = {
    open: boolean;
    onClose: () => void;
};

// 渲染 ARK API Key 设置弹窗
export function ArkApiKeySettingsDialog({ open, onClose }: ArkApiKeySettingsDialogProps) {
    // apiKeyInput 输入框中的 Key
    const [apiKeyInput, setApiKeyInput] = useState("");

    useEffect(() => {
        if (!open) {
            return;
        }

        setApiKeyInput(loadArkApiKey());
    }, [open]);

    // 保存 Key 到本地存储
    const handleSave = useCallback(() => {
        saveArkApiKey(apiKeyInput);
        onClose();
    }, [apiKeyInput, onClose]);

    // 清除本地 Key
    const handleClear = useCallback(() => {
        clearArkApiKey();
        setApiKeyInput("");
        onClose();
    }, [onClose]);

    if (!open) {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[440px] rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
                onClick={(event) => event.stopPropagation()}
            >
                <h3 className="text-base font-semibold text-slate-900">API KEY</h3>

                <label className="mt-4 block">
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">火山方舟API KEY</span>
                    <input
                        type="password"
                        autoComplete="off"
                        spellCheck={false}
                        value={apiKeyInput}
                        onChange={(event) => setApiKeyInput(event.target.value)}
                        placeholder="请输入 ARK_API_KEY"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                </label>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        className="inline-flex cursor-pointer items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                        onClick={handleClear}
                    >
                        清除
                    </button>
                    <button
                        type="button"
                        className="inline-flex cursor-pointer items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                        onClick={onClose}
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        className="inline-flex cursor-pointer items-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/85"
                        onClick={handleSave}
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
