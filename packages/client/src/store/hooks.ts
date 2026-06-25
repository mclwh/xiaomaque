// Redux 类型化 Hooks
import { useDispatch, useSelector, type EqualityFn } from "react-redux";
import type { AppDispatch, RootState } from "@/store";

// 返回类型化的 dispatch
export function useAppDispatch() {
    return useDispatch<AppDispatch>();
}

// 返回类型化的 selector，可选 equalityFn 用于浅比较
export function useAppSelector<TSelected>(
    selector: (state: RootState) => TSelected,
    equalityFn?: EqualityFn<TSelected>,
): TSelected {
    return useSelector(selector, equalityFn);
}
