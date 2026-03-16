import BaseClass from '../base-class';
import type { ValueCallback, VideoWorkerVideoSources } from '../types';
declare class VideoWorkerLocal extends BaseClass {
    type: string;
    player?: HTMLVideoElement;
    $video?: HTMLVideoElement;
    eventHandlers?: {
        ended: (event: Event) => void;
        error: (event: Event) => void;
        loadedmetadata: (event: Event) => void;
        pause: (event: Event) => void;
        play: (event: Event) => void;
        playing: (event: Event) => void;
        timeupdate: (event: Event) => void;
        volumechange: (event: Event) => void;
    };
    static parseURL(url: string): VideoWorkerVideoSources | false;
    play(start?: number): void;
    pause(): void;
    mute(): void;
    unmute(): void;
    setVolume(volume?: number | false): void;
    getVolume(callback: ValueCallback<number | false>): void;
    getMuted(callback: ValueCallback<boolean | null>): void;
    setCurrentTime(currentTime?: number | false): void;
    getCurrentTime(callback: ValueCallback<number>): void;
    getImageURL(callback: ValueCallback<string>): void;
    getVideo(callback: ValueCallback<HTMLVideoElement>): void;
    destroy(): void;
}
export default VideoWorkerLocal;
//# sourceMappingURL=local.d.ts.map