// 顶栏 API Key 设置弹窗：本地保存火山方舟与 OpenAI Key，并随请求发送给服务端
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { clearArkApiKey, loadArkApiKey, saveArkApiKey } from "@/lib/arkApiKeyStorage";
import {
    clearOpenaiApiKey,
    loadOpenaiApiKey,
    saveOpenaiApiKey,
} from "@/lib/openaiApiKeyStorage";

type ArkApiKeySettingsDialogProps = {
    open: boolean;
    onClose: () => void;
};

// 渲染 API Key 设置弹窗
export function ArkApiKeySettingsDialog({ open, onClose }: ArkApiKeySettingsDialogProps) {
    // arkApiKeyInput 火山方舟 Key 输入
    const [arkApiKeyInput, setArkApiKeyInput] = useState("");
    // openaiApiKeyInput OpenAI Key 输入
    const [openaiApiKeyInput, setOpenaiApiKeyInput] = useState("");

    useEffect(() => {
        if (!open) {
            return;
        }

        setArkApiKeyInput(loadArkApiKey());
        setOpenaiApiKeyInput(loadOpenaiApiKey());
    }, [open]);

    // 保存 Key 到本地存储
    const handleSave = useCallback(() => {
        saveArkApiKey(arkApiKeyInput);
        saveOpenaiApiKey(openaiApiKeyInput);
        onClose();
    }, [arkApiKeyInput, onClose, openaiApiKeyInput]);

    // 清除本地 Key
    const handleClear = useCallback(() => {
        clearArkApiKey();
        clearOpenaiApiKey();
        setArkApiKeyInput("");
        setOpenaiApiKeyInput("");
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
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">
                        火山方舟 API KEY
                    </span>
                    <input
                        type="password"
                        autoComplete="off"
                        spellCheck={false}
                        value={arkApiKeyInput}
                        onChange={(event) => setArkApiKeyInput(event.target.value)}
                        placeholder="请输入 ARK_API_KEY"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                </label>

                <label className="mt-4 block">
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">
                        AI API KEY
                    </span>
                    <input
                        type="password"
                        autoComplete="off"
                        spellCheck={false}
                        value={openaiApiKeyInput}
                        onChange={(event) => setOpenaiApiKeyInput(event.target.value)}
                        placeholder="请输入 AI API KEY"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    />
                </label>

                <p className="mt-3 text-xs leading-5 text-slate-400">
                    自定义 AI API KEY 将优先于服务端环境变量，用于剧本摘要、分集剧本等 Agent 能力。
                </p>

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
