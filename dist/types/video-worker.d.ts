import VideoWorkerBase from './base-class';
import type { VideoWorkerOptionsInput } from './types';
export type { VideoWorkerOptions, VideoWorkerOptionsInput } from './types';
export type VideoWorkerInstance = VideoWorkerBase;
type VideoWorkerProvider = typeof VideoWorkerBase;
interface VideoWorkerFactory {
    (url: string, options?: VideoWorkerOptionsInput): VideoWorkerInstance;
    new (url: string, options?: VideoWorkerOptionsInput): VideoWorkerInstance;
    BaseClass: typeof VideoWorkerBase;
    providers: Record<string, VideoWorkerProvider>;
}
declare const VideoWorker: VideoWorkerFactory;
export default VideoWorker;
//# sourceMappingURL=video-worker.d.ts.map