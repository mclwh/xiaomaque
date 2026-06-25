// 认证用户信息类型
export type AuthUser = {
    id: number;
    phone: string;
    nickname?: string | null;
    avatar?: string | null;
    createdAt?: string;
};

// 登录成功写入 Redux 的载荷
export type LoginSuccessPayload = {
    user: AuthUser;
    token: string;
};

// 认证模块 Redux 状态
export type AuthState = {
    token: string | null;
    user: AuthUser | null;
};
