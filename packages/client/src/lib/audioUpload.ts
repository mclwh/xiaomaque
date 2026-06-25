// 音频上传与截取相关常量与工具

// AUDIO_MAX_FILE_SIZE 允许上传的最大音频体积（10MB）
export const AUDIO_MAX_FILE_SIZE = 10 * 1024 * 1024;

// AUDIO_TRIM_THRESHOLD_SECONDS 超过该时长需截取
export const AUDIO_TRIM_THRESHOLD_SECONDS = 5;

// AUDIO_TRIM_MIN_SECONDS 截取片段最小时长
export const AUDIO_TRIM_MIN_SECONDS = 2;

// AUDIO_TRIM_MAX_SECONDS 截取片段最大时长
export const AUDIO_TRIM_MAX_SECONDS = 5;

// 校验音频文件体积是否在允许范围内
export function isValidAudioFileSize(size: number) {
    return size > 0 && size <= AUDIO_MAX_FILE_SIZE;
}

// 判断音频是否需要进入截取流程
export function shouldTrimAudio(durationSeconds: number) {
    return durationSeconds > AUDIO_TRIM_THRESHOLD_SECONDS;
}

// 将截取区间限制在 2-5 秒且不超过音频总时长
export function clampAudioTrimRange(
    start: number,
    end: number,
    durationSeconds: number,
): { start: number; end: number } {
    const maxEnd = Math.min(durationSeconds, start + AUDIO_TRIM_MAX_SECONDS);
    let nextEnd = Math.min(end, maxEnd);
    let nextStart = Math.max(0, start);

    if (nextEnd - nextStart > AUDIO_TRIM_MAX_SECONDS) {
        nextEnd = nextStart + AUDIO_TRIM_MAX_SECONDS;
    }

    if (nextEnd - nextStart < AUDIO_TRIM_MIN_SECONDS) {
        nextEnd = Math.min(durationSeconds, nextStart + AUDIO_TRIM_MIN_SECONDS);
    }

    if (nextEnd - nextStart < AUDIO_TRIM_MIN_SECONDS) {
        nextStart = Math.max(0, nextEnd - AUDIO_TRIM_MIN_SECONDS);
    }

    return { start: nextStart, end: nextEnd };
}

// 从文件名或 MIME 推断音频扩展名
export function inferAudioExtFromFile(file: File | Blob, filename?: string) {
    const nameExt = filename?.split(".").pop()?.toLowerCase();

    if (nameExt && ["mp3", "wav", "m4a", "aac", "ogg", "flac"].includes(nameExt)) {
        return nameExt;
    }

    if (file.type.includes("mpeg")) {
        return "mp3";
    }

    if (file.type.includes("wav")) {
        return "wav";
    }

    if (file.type.includes("mp4") || file.type.includes("m4a")) {
        return "m4a";
    }

    return "wav";
}

// 读取本地音频时长（秒）
export function getAudioDurationSeconds(file: File) {
    return new Promise<number>((resolve, reject) => {
        const audio = document.createElement("audio");
        const objectUrl = URL.createObjectURL(file);

        audio.preload = "metadata";
        audio.onloadedmetadata = () => {
            URL.revokeObjectURL(objectUrl);

            if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
                reject(new Error("无法读取音频时长"));
                return;
            }

            resolve(audio.duration);
        };
        audio.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("无法读取音频文件"));
        };
        audio.src = objectUrl;
    });
}

// 将 AudioBuffer 编码为 WAV Blob
function encodeAudioBufferToWav(audioBuffer: AudioBuffer) {
    const channelCount = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const frameCount = audioBuffer.length;
    const bytesPerSample = 2;
    const blockAlign = channelCount * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = frameCount * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, value: string) => {
        for (let index = 0; index < value.length; index += 1) {
            view.setUint8(offset + index, value.charCodeAt(index));
        }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channelCount, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);

    const channels = Array.from({ length: channelCount }, (_, index) =>
        audioBuffer.getChannelData(index),
    );
    let offset = 44;

    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
        for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
            const sample = Math.max(-1, Math.min(1, channels[channelIndex][frameIndex]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
            offset += 2;
        }
    }

    return new Blob([buffer], { type: "audio/wav" });
}

// 截取音频片段并导出 WAV
export async function trimAudioFileToWav(file: File, startSec: number, endSec: number) {
    const audioContext = new AudioContext();
    const arrayBuffer = await file.arrayBuffer();

    try {
        const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        const sampleRate = decoded.sampleRate;
        const startSample = Math.floor(startSec * sampleRate);
        const endSample = Math.floor(endSec * sampleRate);
        const frameCount = Math.max(0, endSample - startSample);
        const trimmedBuffer = audioContext.createBuffer(
            decoded.numberOfChannels,
            frameCount,
            sampleRate,
        );

        for (let channelIndex = 0; channelIndex < decoded.numberOfChannels; channelIndex += 1) {
            const channelData = decoded.getChannelData(channelIndex);
            trimmedBuffer.copyToChannel(channelData.subarray(startSample, endSample), channelIndex);
        }

        return encodeAudioBufferToWav(trimmedBuffer);
    } finally {
        await audioContext.close();
    }
}
