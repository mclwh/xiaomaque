import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

// 渲染 shadcn 滑块组件
function Slider({
    className,
    defaultValue,
    value,
    min = 0,
    max = 100,
    ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
    const resolvedValues = value ?? defaultValue ?? [min];

    return (
        <SliderPrimitive.Root
            data-slot="slider"
            defaultValue={defaultValue}
            value={value}
            min={min}
            max={max}
            className={cn(
                "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50",
                className,
            )}
            {...props}
        >
            <SliderPrimitive.Track
                data-slot="slider-track"
                className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-slate-200"
            >
                <SliderPrimitive.Range
                    data-slot="slider-range"
                    className="absolute h-full bg-slate-900"
                />
            </SliderPrimitive.Track>
            {resolvedValues.map((_, index) => (
                <SliderPrimitive.Thumb
                    key={index}
                    data-slot="slider-thumb"
                    className="block size-4 rounded-full border border-slate-200 bg-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 disabled:pointer-events-none disabled:opacity-50"
                />
            ))}
        </SliderPrimitive.Root>
    );
}

export { Slider };
