// 项目页可编辑标题：点击进入输入，回车或失焦保存
import { useCallback, useEffect, useRef, useState } from "react";
import { updateProjectTitle } from "@/api/project";
import { cn } from "@/lib/utils";

type ProjectEditableTitleProps = {
    projectId: number;
    title: string;
    onTitleChange: (title: string) => void;
    onSaveError?: (message: string) => void;
};

// 渲染可点击编辑的项目标题
export function ProjectEditableTitle({
    projectId,
    title,
    onTitleChange,
    onSaveError,
}: ProjectEditableTitleProps) {
    // isEditing 是否处于编辑模式
    const [isEditing, setIsEditing] = useState(false);
    // draftTitle 输入框中的标题草稿
    const [draftTitle, setDraftTitle] = useState(title);
    // saving 是否正在保存
    const [saving, setSaving] = useState(false);
    // inputRef 标题输入框引用
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isEditing) {
            setDraftTitle(title);
        }
    }, [isEditing, title]);

    useEffect(() => {
        if (!isEditing || !inputRef.current) {
            return;
        }

        inputRef.current.focus();
        inputRef.current.select();
    }, [isEditing]);

    // 保存标题并退出编辑模式
    const handleSave = useCallback(async () => {
        if (saving) {
            return;
        }

        const trimmed = draftTitle.trim();

        if (!trimmed) {
            setDraftTitle(title);
            setIsEditing(false);
            return;
        }

        if (trimmed === title) {
            setIsEditing(false);
            return;
        }

        setSaving(true);

        try {
            const updated = await updateProjectTitle(projectId, trimmed);
            onTitleChange(updated.title);
            setIsEditing(false);
        } catch {
            setDraftTitle(title);
            setIsEditing(false);
            onSaveError?.("项目重命名失败，请稍后重试");
        } finally {
            setSaving(false);
        }
    }, [draftTitle, onSaveError, onTitleChange, projectId, saving, title]);

    // 进入编辑模式
    const handleStartEdit = useCallback(() => {
        if (saving) {
            return;
        }

        setDraftTitle(title);
        setIsEditing(true);
    }, [saving, title]);

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={draftTitle}
                disabled={saving}
                maxLength={100}
                aria-label="项目名称"
                className={cn(
                    "min-w-0 max-w-[min(100%,320px)] truncate rounded-md border border-slate-300 bg-white px-2 py-1",
                    "text-base font-semibold text-slate-900 outline-none",
                    "focus:border-slate-400 focus:ring-2 focus:ring-black/5",
                )}
                onChange={(event) => setDraftTitle(event.target.value)}
                onBlur={() => {
                    void handleSave();
                }}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        event.currentTarget.blur();
                    }

                    if (event.key === "Escape") {
                        event.preventDefault();
                        setDraftTitle(title);
                        setIsEditing(false);
                    }
                }}
            />
        );
    }

    return (
        <button
            type="button"
            className="min-w-0 max-w-[min(100%,320px)] cursor-text truncate rounded-md px-2 py-1 text-left text-base font-semibold text-slate-900 transition hover:bg-black/5"
            onClick={handleStartEdit}
        >
            {title}
        </button>
    );
}
