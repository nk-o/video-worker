import BaseClass from '../base-class';
import type { ValueCallback, YouTubePlayer, YouTubePlayerOptions } from '../types';
declare class VideoWorkerYoutube extends BaseClass {
    type: string;
    player?: YouTubePlayer;
    $video?: HTMLElement;
    playerOptions?: YouTubePlayerOptions;
    static parseURL(url: string): string | false;
    init(): void;
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
    getVideo(callback: ValueCallback<HTMLElement>): void;
}
export default VideoWorkerYoutube;
//# sourceMappingURL=youtube.d.ts.map