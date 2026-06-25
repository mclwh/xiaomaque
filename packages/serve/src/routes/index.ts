import path from "path";
import { fileURLToPath } from "url";
import { autoRouter } from "../utils/autoRouter.js";
import { createJwtMiddleware } from "../middleware/jwt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = await autoRouter({
    controllersDir: path.join(__dirname, "../controllers"),
    basePath: "/api",
    defaultMiddlewares: [
        createJwtMiddleware(["/auth/login"]),
    ],
});

export default router;
