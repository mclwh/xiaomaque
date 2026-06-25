import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { JwtPayload } from "../middleware/jwt.js";

export function signToken(payload: JwtPayload): string {
    const options: SignOptions = {
        expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    };
    return jwt.sign(payload, env.JWT_SECRET, options);
}
