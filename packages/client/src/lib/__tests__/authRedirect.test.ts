import { describe, expect, it } from "vitest";
import { isUnauthorizedResponse } from "@/lib/authRedirect";

describe("isUnauthorizedResponse", () => {
    it("识别 HTTP 401", () => {
        expect(isUnauthorizedResponse(401, undefined)).toBe(true);
    });

    it("识别业务码 401", () => {
        expect(isUnauthorizedResponse(200, 401)).toBe(true);
    });

    it("非 401 返回 false", () => {
        expect(isUnauthorizedResponse(403, 403)).toBe(false);
    });
});
