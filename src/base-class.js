import defaults from './defaults';
import extend from './utils/extend';

let ID = 0;

class VideoWorkerBase {
  type = 'none';

  constructor(url, options) {
    const self = this;

    self.url = url;

    self.options_default = { ...defaults };

    self.options = extend({}, self.options_default, options);

    // check URL
    self.videoID = self.constructor.parseURL(url);

    // init
    if (self.videoID) {
      self.init();
    }
  }

  isValid() {
    return !!this.videoID;
  }

  init() {
    const self = this;

    self.ID = ID;
    ID += 1;

    self.playerID = `VideoWorker-${self.ID}`;
  }

  // events
  on(name, callback) {
    this.userEventsList = this.userEventsList || [];

    // add new callback in events list
    (this.userEventsList[name] || (this.userEventsList[name] = [])).push(callback);
  }

  off(name, callback) {
    if (!this.userEventsList || !this.userEventsList[name]) {
      return;
    }

    if (!callback) {
      delete this.userEventsList[name];
    } else {
      this.userEventsList[name].forEach((val, key) => {
        if (val === callback) {
          this.userEventsList[name][key] = false;
        }
      });
    }
  }

  fire(name, ...args) {
    if (this.userEventsList && typeof this.userEventsList[name] !== 'undefined') {
      this.userEventsList[name].forEach((val) => {
        // call with all arguments
        if (val) {
          val.apply(this, args);
        }
      });
    }
  }

  /**
   * Methods used in providers.
   */
  /* eslint-disable */
  static parseURL(url) {
    return false;
  }
  play(start) {}
  pause() {}
  mute() {}
  unmute() {}
  setVolume(volume = false) {}
  getVolume(callback) {}
  getMuted(callback) {}
  setCurrentTime(currentTime = false) {}
  getCurrentTime(callback) {}
  getImageURL(callback) {}
  getVideo(callback) {}
  /* eslint-enable */
}

export default VideoWorkerBase;
