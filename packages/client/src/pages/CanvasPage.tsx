// 自由画布页：全屏 React Flow 无限画布（无应用壳布局）
import { useParams } from "react-router-dom";
import { CanvasWorkspace } from "@/components/canvas/CanvasWorkspace";

// 渲染全屏自由画布
export function CanvasPage() {
    const { projectId } = useParams<{ projectId: string }>();

    return (
        <div className="h-svh w-screen overflow-hidden">
            <CanvasWorkspace projectId={Number(projectId)} />
        </div>
    );
}
