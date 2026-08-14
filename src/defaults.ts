import type { VideoWorkerOptions } from './types';

const defaults: VideoWorkerOptions = {
  autoplay: false,
  loop: false,
  mute: false,
  volume: 100,
  showControls: true,
  accessibilityHidden: false,

  // Origin the player embed is loaded from. Override to use youtube-nocookie.com or a proxy.
  youtubeHost: 'https://www.youtube.com',
  vimeoHost: 'https://player.vimeo.com',

  // start / end video time in seconds
  startTime: 0,
  endTime: 0,
};

export default defaults;
