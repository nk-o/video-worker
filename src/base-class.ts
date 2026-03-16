import defaults from './defaults';
import type {
  ParsedVideoID,
  ValueCallback,
  VideoWorkerElement,
  VideoWorkerEventCallback,
  VideoWorkerOptions,
  VideoWorkerOptionsInput,
} from './types';
import extend from './utils/extend';

let ID = 0;

class VideoWorkerBase {
  type = 'none';

  url: string;

  options_default: VideoWorkerOptions;

  options: VideoWorkerOptions;

  videoID: ParsedVideoID;

  ID!: number;

  playerID!: string;

  userEventsList?: Record<string, Array<VideoWorkerEventCallback | false>>;

  player?: unknown;

  $video?: VideoWorkerElement;

  videoImage?: string;

  videoWidth?: number;

  videoHeight?: number;

  constructor(url: string, options?: VideoWorkerOptionsInput) {
    this.url = url;
    this.options_default = { ...defaults };
    this.options = extend({ ...this.options_default }, options);

    // check URL
    this.videoID = (this.constructor as typeof VideoWorkerBase).parseURL(url);

    // init
    if (this.videoID) {
      this.init();
    }
  }

  isValid(): boolean {
    return !!this.videoID;
  }

  init(): void {
    this.ID = ID;
    ID += 1;

    this.playerID = `VideoWorker-${this.ID}`;
  }

  // events
  on(name: string, callback: VideoWorkerEventCallback): void {
    this.userEventsList = this.userEventsList || {};
    if (!this.userEventsList[name]) {
      // add new callback in events list
      this.userEventsList[name] = [];
    }

    this.userEventsList[name].push(callback);
  }

  off(name: string, callback?: VideoWorkerEventCallback): void {
    if (!this.userEventsList || !this.userEventsList[name]) {
      return;
    }

    if (!callback) {
      delete this.userEventsList[name];
      return;
    }

    this.userEventsList[name].forEach((value, key) => {
      if (value === callback) {
        const eventList = this.userEventsList?.[name];
        if (eventList) {
          eventList[key] = false;
        }
      }
    });
  }

  fire(name: string, ...args: unknown[]): void {
    if (this.userEventsList && typeof this.userEventsList[name] !== 'undefined') {
      this.userEventsList[name].forEach((value) => {
        // call with all arguments
        if (value) {
          value.apply(this, args);
        }
      });
    }
  }

  /**
   * Methods used in providers.
   */
  static parseURL(_url: string): ParsedVideoID {
    return false;
  }

  play(_start?: number): void {}

  pause(): void {}

  mute(): void {}

  unmute(): void {}

  setVolume(_volume: number | false = false): void {}

  getVolume(_callback: ValueCallback<number | false>): void {}

  getMuted(_callback: ValueCallback<boolean | null>): void {}

  setCurrentTime(_currentTime: number | false = false): void {}

  getCurrentTime(_callback: ValueCallback<number>): void {}

  getImageURL(_callback: ValueCallback<string>): void {}

  getVideo(_callback: ValueCallback<VideoWorkerElement>): void {}
}

export default VideoWorkerBase;
