import type { ParsedVideoID, ValueCallback, VideoWorkerElement, VideoWorkerEventCallback, VideoWorkerOptions, VideoWorkerOptionsInput } from './types';
declare class VideoWorkerBase {
    type: string;
    url: string;
    options_default: VideoWorkerOptions;
    options: VideoWorkerOptions;
    videoID: ParsedVideoID;
    ID: number;
    playerID: string;
    userEventsList?: Record<string, Array<VideoWorkerEventCallback | false>>;
    player?: unknown;
    $video?: VideoWorkerElement;
    hiddenContainer?: HTMLDivElement;
    videoImage?: string;
    videoWidth?: number;
    videoHeight?: number;
    destroyed: boolean;
    constructor(url: string, options?: VideoWorkerOptionsInput);
    isValid(): boolean;
    init(): void;
    on(name: string, callback: VideoWorkerEventCallback): void;
    off(name: string, callback?: VideoWorkerEventCallback): void;
    fire(name: string, ...args: unknown[]): void;
    /**
     * Methods used in providers.
     */
    static parseURL(_url: string): ParsedVideoID;
    play(_start?: number): void;
    pause(): void;
    mute(): void;
    unmute(): void;
    setVolume(_volume?: number | false): void;
    getVolume(_callback: ValueCallback<number | false>): void;
    getMuted(_callback: ValueCallback<boolean | null>): void;
    setCurrentTime(_currentTime?: number | false): void;
    getCurrentTime(_callback: ValueCallback<number>): void;
    getImageURL(_callback: ValueCallback<string>): void;
    getVideo(_callback: ValueCallback<VideoWorkerElement>): void;
    destroy(): void;
}
export default VideoWorkerBase;
//# sourceMappingURL=base-class.d.ts.map