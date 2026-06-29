// 全局 API Key 配置提醒：服务端未配置时在右上角展示 Notice
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchArkApiKeyStatus, fetchOpenaiApiKeyStatus } from "@/api/config";
import { TopRightNotice } from "@/components/ui/top-right-notice";
import {
    ARK_API_KEY_CHANGED_EVENT,
    hasCustomArkApiKey,
} from "@/lib/arkApiKeyStorage";
import {
    OPENAI_API_KEY_CHANGED_EVENT,
    hasCustomOpenaiApiKey,
} from "@/lib/openaiApiKeyStorage";
import { selectIsAuthenticated } from "@/store/authSlice";
import { useAppSelector } from "@/store/hooks";

// 渲染全局 API Key 配置提醒
export function ArkApiKeySetupNotice() {
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    // serverArkConfigured 服务端是否已配置 ARK API Key
    const [serverArkConfigured, setServerArkConfigured] = useState<boolean | null>(null);
    // serverOpenaiConfigured 服务端是否已配置 OpenAI API Key
    const [serverOpenaiConfigured, setServerOpenaiConfigured] = useState<boolean | null>(null);
    // hasClientArkKey 用户是否已在本地配置 ARK Key
    const [hasClientArkKey, setHasClientArkKey] = useState(hasCustomArkApiKey);
    // hasClientOpenaiKey 用户是否已在本地配置 OpenAI Key
    const [hasClientOpenaiKey, setHasClientOpenaiKey] = useState(hasCustomOpenaiApiKey);
    // dismissed 用户是否已手动关闭本次会话提醒
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            setServerArkConfigured(null);
            setServerOpenaiConfigured(null);
            return;
        }

        const controller = new AbortController();

        void Promise.all([
            fetchArkApiKeyStatus(controller.signal),
            fetchOpenaiApiKeyStatus(controller.signal),
        ])
            .then(([arkStatus, openaiStatus]) => {
                setServerArkConfigured(arkStatus.configured);
                setServerOpenaiConfigured(openaiStatus.configured);
            })
            .catch(() => {
                setServerArkConfigured(null);
                setServerOpenaiConfigured(null);
            });

        return () => {
            controller.abort();
        };
    }, [isAuthenticated]);

    useEffect(() => {
        const handleApiKeyChanged = () => {
            const nextHasClientArkKey = hasCustomArkApiKey();
            const nextHasClientOpenaiKey = hasCustomOpenaiApiKey();

            setHasClientArkKey(nextHasClientArkKey);
            setHasClientOpenaiKey(nextHasClientOpenaiKey);

            if (!nextHasClientArkKey && !nextHasClientOpenaiKey) {
                setDismissed(false);
            }
        };

        window.addEventListener(ARK_API_KEY_CHANGED_EVENT, handleApiKeyChanged);
        window.addEventListener(OPENAI_API_KEY_CHANGED_EVENT, handleApiKeyChanged);

        return () => {
            window.removeEventListener(ARK_API_KEY_CHANGED_EVENT, handleApiKeyChanged);
            window.removeEventListener(OPENAI_API_KEY_CHANGED_EVENT, handleApiKeyChanged);
        };
    }, []);

    // noticeMessage 根据缺失项组合提醒文案
    const noticeMessage = useMemo(() => {
        const missing: string[] = [];

        if (serverArkConfigured === false && !hasClientArkKey) {
            missing.push("火山方舟 API KEY");
        }

        if (serverOpenaiConfigured === false && !hasClientOpenaiKey) {
            missing.push("AI API KEY");
        }

        if (missing.length === 0) {
            return "";
        }

        return `服务端未配置 ${missing.join("、")}，请点击右上角设置按钮，在弹窗中填写对应 API KEY。`;
    }, [hasClientArkKey, hasClientOpenaiKey, serverArkConfigured, serverOpenaiConfigured]);

    // handleCloseNotice 手动关闭提醒
    const handleCloseNotice = useCallback(() => {
        setDismissed(true);
    }, []);

    const open = isAuthenticated && noticeMessage.length > 0 && !dismissed;

    return (
        <TopRightNotice
            message={noticeMessage}
            open={open}
            variant="warning"
            onClose={handleCloseNotice}
        />
    );
}
