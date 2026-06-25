// 构建分集编辑页路径
export function getEpisodeEditPath(
    projectId: number,
    serieId: number,
    fragmentId?: string | number | null,
) {
    // basePath 分集编辑基础路径
    const basePath = `/novel/project/${projectId}/episode/${serieId}/edit`;

    if (fragmentId === undefined || fragmentId === null || fragmentId === "") {
        return basePath;
    }

    const params = new URLSearchParams({
        fragment_id: String(fragmentId),
    });

    return `${basePath}?${params.toString()}`;
}
