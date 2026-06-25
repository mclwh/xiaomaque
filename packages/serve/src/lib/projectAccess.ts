import { prisma } from "../config/prisma.js";
import { NotFoundError } from "./errors.js";

// 校验项目是否属于当前用户
export async function assertProjectOwner(userId: number, projectId: number) {
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            user_id: userId,
        },
    });

    if (!project) {
        throw new NotFoundError("项目不存在");
    }

    return project;
}
