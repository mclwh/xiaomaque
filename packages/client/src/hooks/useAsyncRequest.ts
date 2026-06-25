// 通用异步请求 Hook：封装 loading / data / error 与手动重试
import { useCallback, useEffect, useRef, useState } from "react";
import type { RequestOptions } from "@/api/types";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { isAbortError } from "@/lib/isAbortError";

// AsyncRequestFn 支持可选 AbortSignal 的请求函数
export type AsyncRequestFn<TParams, TData> = (
    params: TParams,
    options?: RequestOptions,
) => Promise<TData>;

// UseAsyncRequestOptions 通用请求 Hook 配置
export type UseAsyncRequestOptions<TParams> = {
    defaultErrorMessage?: string;
    immediate?: boolean;
    params?: TParams;
    enabled?: boolean;
};

// UseAsyncRequestResult 通用请求 Hook 返回值
export type UseAsyncRequestResult<TData, TParams> = {
    data: TData | null;
    loading: boolean;
    errorMessage: string;
    run: (params: TParams) => Promise<TData | null>;
    reset: () => void;
};

/*
 * useAsyncRequest 通用异步请求 Hook
 * @param requestFn 任意返回 Promise 的请求函数
 * @param options immediate 为 true 时会在 params / enabled 变化后自动触发
 */
export function useAsyncRequest<TData, TParams>(
    requestFn: AsyncRequestFn<TParams, TData>,
    options: UseAsyncRequestOptions<TParams> = {},
): UseAsyncRequestResult<TData, TParams> {
    const {
        defaultErrorMessage = "请求失败，请稍后重试",
        immediate = false,
        params,
        enabled = true,
    } = options;

    const [data, setData] = useState<TData | null>(null);
    const [loading, setLoading] = useState(immediate && enabled);
    const [errorMessage, setErrorMessage] = useState("");
    const requestIdRef = useRef(0);

    // 执行一次请求并更新本地状态
    const run = useCallback(
        async (runParams: TParams, requestOptions?: RequestOptions) => {
            const requestId = ++requestIdRef.current;
            setLoading(true);
            setErrorMessage("");

            try {
                const result = await requestFn(runParams, requestOptions);

                if (requestId === requestIdRef.current) {
                    setData(result);
                }

                return result;
            } catch (error) {
                if (isAbortError(error)) {
                    return null;
                }

                if (requestId === requestIdRef.current) {
                    setData(null);
                    setErrorMessage(getApiErrorMessage(error, defaultErrorMessage));
                }

                return null;
            } finally {
                if (requestId === requestIdRef.current) {
                    setLoading(false);
                }
            }
        },
        [defaultErrorMessage, requestFn],
    );

    // 重置请求状态并忽略进行中的响应
    const reset = useCallback(() => {
        requestIdRef.current += 1;
        setData(null);
        setLoading(false);
        setErrorMessage("");
    }, []);

    useEffect(() => {
        if (!immediate || !enabled) {
            return;
        }

        const controller = new AbortController();
        void run(params as TParams, { signal: controller.signal });

        return () => {
            controller.abort();
        };
    }, [enabled, immediate, params, run]);

    return {
        data,
        loading,
        errorMessage,
        run,
        reset,
    };
}
