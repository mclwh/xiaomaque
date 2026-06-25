// 用户认证 Redux Slice：登录态
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { clearAuthSession, loadAuthSession, saveAuthSession } from "@/lib/authStorage";
import type { AuthState, LoginSuccessPayload } from "@/store/types/auth";

// persistedSession 启动时从 localStorage 恢复的登录态
const persistedSession = loadAuthSession();

// initialState 认证模块初始状态
const initialState: AuthState = {
    token: persistedSession?.token ?? null,
    user: persistedSession?.user ?? null,
};

// 将当前认证状态同步到 localStorage
function persistAuthState(state: AuthState) {
    if (!state.token || !state.user) {
        clearAuthSession();
        return;
    }

    saveAuthSession({
        token: state.token,
        user: state.user,
    });
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        // 登录成功：写入用户信息与 token
        loginSuccess(state, action: PayloadAction<LoginSuccessPayload>) {
            state.token = action.payload.token;
            state.user = action.payload.user;
            persistAuthState(state);
        },
        // 更新当前用户信息（如启动时从 profile 接口刷新）
        setUser(state, action: PayloadAction<AuthState["user"]>) {
            state.user = action.payload;
            persistAuthState(state);
        },
        // 退出登录：清空认证状态
        logout(state) {
            state.token = null;
            state.user = null;
            clearAuthSession();
        },
    },
});

export const { loginSuccess, setUser, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;

// 判断是否已登录
export function selectIsAuthenticated(state: { auth: AuthState }) {
    return Boolean(state.auth.token && state.auth.user);
}
