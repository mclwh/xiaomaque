import type { RecentProject } from "@/api/project";
import type { NovelProject } from "@/data/novelProjects";

// 格式化项目更新时间为展示字符串
function formatProjectUpdatedAt(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    const pad = (num: number) => String(num).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// 将接口返回的最近项目映射为卡片展示数据
export function mapRecentProjectToNovelProject(project: RecentProject): NovelProject {
    return {
        id: String(project.id),
        title: project.title,
        updatedAt: formatProjectUpdatedAt(project.updatedAt),
        episodeCount: project.episodeCount,
    };
}
