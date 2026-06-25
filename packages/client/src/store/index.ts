// Redux Store 配置
import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/store/authSlice";
import { canvasReducer } from "@/store/canvasSlice";

// 创建全局 Redux Store
export const store = configureStore({
    reducer: {
        auth: authReducer,
        canvas: canvasReducer,
    },
});

// RootState 全局状态类型
export type RootState = ReturnType<typeof store.getState>;

// AppDispatch Store 派发类型
export type AppDispatch = typeof store.dispatch;
