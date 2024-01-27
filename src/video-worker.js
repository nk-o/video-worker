import VideoWorkerBase from './base-class';
import VideoWorkerYoutube from './providers/youtube';
import VideoWorkerVimeo from './providers/vimeo';
import VideoWorkerLocal from './providers/local';

function VideoWorker(url, options) {
  let result = false;

  Object.keys(VideoWorker.providers).forEach((key) => {
    if (!result && VideoWorker.providers[key].parseURL(url)) {
      result = new VideoWorker.providers[key](url, options);
    }
  });

  return result || new VideoWorkerBase(url, options);
}

VideoWorker.BaseClass = VideoWorkerBase;
VideoWorker.providers = {
  Youtube: VideoWorkerYoutube,
  Vimeo: VideoWorkerVimeo,
  Local: VideoWorkerLocal,
};

export default VideoWorker;
