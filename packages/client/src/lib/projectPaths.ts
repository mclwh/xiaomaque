// 短剧项目列表页路径
export function getNovelPagePath() {
    return "/novel";
}

// 项目工作流页路径
export function getProjectPagePath(projectId: number) {
    return `/novel/project/${projectId}`;
}
