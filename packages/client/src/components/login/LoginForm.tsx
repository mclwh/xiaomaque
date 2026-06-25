// 登录页表单：手机号登录
import { useCallback, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Bird } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginWithPhone } from "@/api/auth";
import { ApiError } from "@/api/types";
import { loginSuccess } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";

// 中国大陆手机号格式校验
const PHONE_PATTERN = /^1[3-9]\d{9}$/;

// 渲染登录表单
export function LoginForm() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();
    // redirectUrl 登录成功后的跳转地址
    const redirectUrl = searchParams.get("redirect_url") || "/";
    // phone 手机号输入值
    const [phone, setPhone] = useState("");
    // submitting 登录提交中状态
    const [submitting, setSubmitting] = useState(false);
    // errorMessage 表单错误提示
    const [errorMessage, setErrorMessage] = useState("");

    // 提交手机号登录
    const handleSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setErrorMessage("");

            if (!PHONE_PATTERN.test(phone)) {
                setErrorMessage("请输入正确的手机号");
                return;
            }

            setSubmitting(true);

            try {
                const result = await loginWithPhone(phone);
                dispatch(
                    loginSuccess({
                        user: result.user,
                        token: result.token,
                    }),
                );
                navigate(redirectUrl, { replace: true });
            } catch (error) {
                setErrorMessage(error instanceof ApiError ? error.message : "登录失败，请稍后重试");
            } finally {
                setSubmitting(false);
            }
        },
        [dispatch, navigate, phone, redirectUrl],
    );

    return (
        <section className="flex w-full flex-col items-center justify-center px-6 py-10">
            <div className="flex w-full max-w-[420px] flex-col items-center">
                <Link
                    to="/"
                    className="mb-8 inline-flex size-11 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-90"
                    aria-label="返回首页"
                >
                    <Bird className="size-5" strokeWidth={2.2} />
                </Link>

                <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
                    欢迎使用小麻雀
                </h1>

                <form className="mt-10 w-full space-y-3" onSubmit={handleSubmit}>
                    <label className="sr-only" htmlFor="login-phone">
                        请输入手机号
                    </label>
                    <input
                        id="login-phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder="请输入手机号（登录即注册）"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value.trim())}
                        className="h-14 max-h-14 w-full max-w-[420px] rounded-[13.2px] border-none bg-[#f3f3f3] px-[1.1rem] text-[16.5px] text-slate-900 outline-none transition-[background-color,box-shadow] duration-200 placeholder:text-slate-400 focus:bg-[#ececec] focus:shadow-[0_0_0_2px_rgba(15,23,42,0.08)]"
                    />

                    {errorMessage ? (
                        <p className="pt-1 text-sm text-red-500" role="alert">
                            {errorMessage}
                        </p>
                    ) : null}

                    <Button
                        type="submit"
                        disabled={submitting}
                        className="mt-2 h-14 max-h-14 w-full max-w-[420px] rounded-xl bg-black text-[16.5px] font-medium text-white hover:bg-black/90"
                    >
                        {submitting ? "登录中..." : "登录"}
                    </Button>
                </form>
            </div>
        </section>
    );
}
