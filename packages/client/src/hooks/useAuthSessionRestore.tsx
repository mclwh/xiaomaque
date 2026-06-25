// 应用启动时校验本地 token 并刷新用户信息
import { useEffect } from "react";
import { fetchProfile } from "@/api/auth";
import { isAbortError } from "@/lib/isAbortError";
import { logout, setUser } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// 挂载于应用根节点，无 UI 输出
export function AuthSessionRestore() {
    const dispatch = useAppDispatch();
    const token = useAppSelector((state) => state.auth.token);

    useEffect(() => {
        if (!token) {
            return;
        }

        const controller = new AbortController();

        fetchProfile({ signal: controller.signal })
            .then((user) => {
                dispatch(setUser(user));
            })
            .catch((error) => {
                if (isAbortError(error)) {
                    return;
                }

                dispatch(logout());
            });

        return () => {
            controller.abort();
        };
    }, [dispatch, token]);

    return null;
}
