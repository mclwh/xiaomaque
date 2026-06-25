import axios from "axios";

// 判断异常是否由 AbortController 取消请求导致
export function isAbortError(error: unknown) {
    if (axios.isCancel(error)) {
        return true;
    }

    return error instanceof DOMException && error.name === "AbortError";
}
