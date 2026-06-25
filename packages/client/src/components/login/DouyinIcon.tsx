// 抖音登录按钮图标
type DouyinIconProps = {
    className?: string;
};

// 渲染抖音品牌 SVG 图标
export function DouyinIcon({ className }: DouyinIconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className={className}
        >
            <path
                d="M16.6 5.82v8.98c0 2.45-1.98 4.43-4.43 4.43a4.43 4.43 0 0 1-4.43-4.43 4.43 4.43 0 0 1 4.43-4.43c.36 0 .71.04 1.04.12V8.9a8.18 8.18 0 0 0-1.04-.07 8.18 8.18 0 0 0-8.18 8.18 8.18 8.18 0 0 0 8.18 8.18 8.18 8.18 0 0 0 8.18-8.18V5.82H16.6Z"
                fill="currentColor"
            />
            <path
                d="M18.2 4.5c.98.74 2.18 1.18 3.47 1.24V7.8c-1.2-.05-2.33-.45-3.3-1.14-.45-.33-.84-.72-1.16-1.16H18.2Z"
                fill="currentColor"
            />
        </svg>
    );
}
