import VideoWorkerBase from './base-class';
import VideoWorkerLocal from './providers/local';
import VideoWorkerVimeo from './providers/vimeo';
import VideoWorkerYoutube from './providers/youtube';
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

const VideoWorker = function (
  this: unknown,
  url: string,
  options?: VideoWorkerOptionsInput
): VideoWorkerInstance {
  let result: VideoWorkerInstance | false = false;

  Object.keys(VideoWorker.providers).forEach((key) => {
    if (!result && VideoWorker.providers[key].parseURL(url)) {
      result = new VideoWorker.providers[key](url, options);
    }
  });

  return result || new VideoWorkerBase(url, options);
} as VideoWorkerFactory;

VideoWorker.BaseClass = VideoWorkerBase;
VideoWorker.providers = {
  Youtube: VideoWorkerYoutube,
  Vimeo: VideoWorkerVimeo,
  Local: VideoWorkerLocal,
};

export default VideoWorker;
