// 全局 ARK API Key 配置提醒：服务端未配置时在右上角展示 Notice
import { useCallback, useEffect, useState } from "react";
import { fetchArkApiKeyStatus } from "@/api/config";
import { TopRightNotice } from "@/components/ui/top-right-notice";
import {
    ARK_API_KEY_CHANGED_EVENT,
    hasCustomArkApiKey,
} from "@/lib/arkApiKeyStorage";
import { selectIsAuthenticated } from "@/store/authSlice";
import { useAppSelector } from "@/store/hooks";

// ARK_API_KEY_NOTICE_MESSAGE 服务端未配置时的提醒文案
const ARK_API_KEY_NOTICE_MESSAGE =
    "服务端未配置 API KEY，请点击右上角设置按钮，在弹窗中填写火山方舟 API KEY。";

// 渲染全局 ARK API Key 配置提醒
export function ArkApiKeySetupNotice() {
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    // serverConfigured 服务端是否已配置 ARK API Key
    const [serverConfigured, setServerConfigured] = useState<boolean | null>(null);
    // hasClientKey 用户是否已在本地配置 Key
    const [hasClientKey, setHasClientKey] = useState(hasCustomArkApiKey);
    // dismissed 用户是否已手动关闭本次会话提醒
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            setServerConfigured(null);
            return;
        }

        const controller = new AbortController();

        void fetchArkApiKeyStatus(controller.signal)
            .then((status) => {
                setServerConfigured(status.configured);
            })
            .catch(() => {
                setServerConfigured(null);
            });

        return () => {
            controller.abort();
        };
    }, [isAuthenticated]);

    useEffect(() => {
        const handleArkApiKeyChanged = () => {
            const nextHasClientKey = hasCustomArkApiKey();

            setHasClientKey(nextHasClientKey);

            if (!nextHasClientKey) {
                setDismissed(false);
            }
        };

        window.addEventListener(ARK_API_KEY_CHANGED_EVENT, handleArkApiKeyChanged);

        return () => {
            window.removeEventListener(ARK_API_KEY_CHANGED_EVENT, handleArkApiKeyChanged);
        };
    }, []);

    // handleCloseNotice 手动关闭提醒
    const handleCloseNotice = useCallback(() => {
        setDismissed(true);
    }, []);

    const open =
        isAuthenticated &&
        serverConfigured === false &&
        !hasClientKey &&
        !dismissed;

    return (
        <TopRightNotice
            message={ARK_API_KEY_NOTICE_MESSAGE}
            open={open}
            variant="warning"
            onClose={handleCloseNotice}
        />
    );
}
