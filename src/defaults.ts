import type { VideoWorkerOptions } from './types';

const defaults: VideoWorkerOptions = {
  autoplay: false,
  loop: false,
  mute: false,
  volume: 100,
  showControls: true,
  accessibilityHidden: false,

  // start / end video time in seconds
  startTime: 0,
  endTime: 0,
};

export default defaults;
