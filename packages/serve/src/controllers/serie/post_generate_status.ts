import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { readArkApiKeyFromRequest } from "../../lib/arkApiKey.js";
import { validateMiddleware } from "../../middleware/validate.js";
import {
    fetchSerieDetailAfterGeneration,
    pollSerieFragmentSeedanceTask,
} from "../../services/serieGeneration.js";
import { pollSerieGenerateSchema, type PollSerieGenerateInput } from "../../validators/serie.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(pollSerieGenerateSchema)];

// 轮询分镜 Seedance 视频生成任务进度
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const {
        project_id: projectId,
        serie_id: serieId,
        fragment_id: fragmentId,
        task_id: taskId,
    } = req.body as PollSerieGenerateInput;

    const arkApiKey = readArkApiKeyFromRequest(req);
    const pollResult = await pollSerieFragmentSeedanceTask(
        req.user!.userId,
        projectId,
        serieId,
        fragmentId,
        taskId,
        arkApiKey,
    );

    if (pollResult.status === "succeeded") {
        const serie = await fetchSerieDetailAfterGeneration(req.user!.userId, projectId, serieId);

        return success(res, { ...pollResult, serie }, "生成完成");
    }

    return success(res, pollResult, "ok");
});
