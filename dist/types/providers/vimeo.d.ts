import BaseClass from '../base-class';
import type { ValueCallback, VimeoPlayer, VimeoPlayerOptions } from '../types';
declare class VideoWorkerVimeo extends BaseClass {
    type: string;
    player?: VimeoPlayer;
    $video?: HTMLIFrameElement;
    playerOptions?: VimeoPlayerOptions;
    imageRequest?: XMLHttpRequest;
    static parseURL(url: string): string | false;
    static parseURLHash(url: string): string | null;
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
    getVideo(callback: ValueCallback<HTMLIFrameElement>): void;
    destroy(): void;
}
export default VideoWorkerVimeo;
//# sourceMappingURL=vimeo.d.ts.map