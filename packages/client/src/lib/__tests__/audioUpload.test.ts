import { describe, expect, it } from "vitest";
import {
    AUDIO_MAX_FILE_SIZE,
    AUDIO_TRIM_MAX_SECONDS,
    AUDIO_TRIM_MIN_SECONDS,
    AUDIO_TRIM_THRESHOLD_SECONDS,
    clampAudioTrimRange,
    isValidAudioFileSize,
    shouldTrimAudio,
} from "@/lib/audioUpload";

describe("audioUpload", () => {
    it("isValidAudioFileSize 限制 10MB", () => {
        expect(isValidAudioFileSize(1)).toBe(true);
        expect(isValidAudioFileSize(AUDIO_MAX_FILE_SIZE)).toBe(true);
        expect(isValidAudioFileSize(AUDIO_MAX_FILE_SIZE + 1)).toBe(false);
        expect(isValidAudioFileSize(0)).toBe(false);
    });

    it("shouldTrimAudio 超过 5 秒需截取", () => {
        expect(shouldTrimAudio(AUDIO_TRIM_THRESHOLD_SECONDS)).toBe(false);
        expect(shouldTrimAudio(AUDIO_TRIM_THRESHOLD_SECONDS + 0.1)).toBe(true);
    });

    it("clampAudioTrimRange 限制 2-5 秒", () => {
        const range = clampAudioTrimRange(1, 8, 20);

        expect(range.end - range.start).toBeLessThanOrEqual(AUDIO_TRIM_MAX_SECONDS);
        expect(range.end - range.start).toBeGreaterThanOrEqual(AUDIO_TRIM_MIN_SECONDS);
    });
});
