import BaseClass from '../base-class';
import global from '../utils/global';
import Deferred from '../utils/deferred';

let VimeoAPIadded = 0;
let loadingVimeoPlayer = 0;
const loadingVimeoDefer = new Deferred();

function loadAPI() {
  if (VimeoAPIadded) {
    return;
  }

  VimeoAPIadded = true;

  // Useful when Vimeo API added using RequireJS https://github.com/nk-o/video-worker/pull/7
  if (typeof global.Vimeo !== 'undefined') {
    return;
  }

  const src = 'https://player.vimeo.com/api/player.js';

  // add script in head section
  let tag = document.createElement('script');
  let head = document.getElementsByTagName('head')[0];
  tag.src = src;

  head.appendChild(tag);

  head = null;
  tag = null;
}

function onAPIready(callback) {
  if (typeof global.Vimeo === 'undefined' && !loadingVimeoPlayer) {
    loadingVimeoPlayer = 1;
    const vimeoInterval = setInterval(() => {
      if (typeof global.Vimeo !== 'undefined') {
        clearInterval(vimeoInterval);
        loadingVimeoDefer.resolve('done');
        callback();
      }
    }, 20);
  } else if (typeof global.Vimeo !== 'undefined') {
    callback();
  } else {
    loadingVimeoDefer.done(() => {
      callback();
    });
  }
}

class VideoWorkerVimeo extends BaseClass {
  type = 'vimeo';

  static parseURL(url) {
    // eslint-disable-next-line no-useless-escape
    const regExp =
      /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(regExp);
    return match && match[3] ? match[3] : false;
  }

  // Try to extract a hash for private videos from the URL.
  // Thanks to https://github.com/sampotts/plyr
  static parseURLHash(url) {
    /* This regex matches a hexadecimal hash if given in any of these forms:
     *  - [https://player.]vimeo.com/video/{id}/{hash}[?params]
     *  - [https://player.]vimeo.com/video/{id}?h={hash}[&params]
     *  - [https://player.]vimeo.com/video/{id}?[params]&h={hash}
     *  - video/{id}/{hash}
     * If matched, the hash is available in capture group 4
     */
    const regex = /^.*(vimeo.com\/|video\/)(\d+)(\?.*&*h=|\/)+([\d,a-f]+)/;
    const found = url.match(regex);

    return found && found.length === 5 ? found[4] : null;
  }

  init() {
    super.init();

    loadAPI();
  }

  play(start) {
    const self = this;
    if (!self.player) {
      return;
    }

    if (typeof start !== 'undefined') {
      self.player.setCurrentTime(start);
    }

    self.player.getPaused().then((paused) => {
      if (paused) {
        // Don't play if video is already ended and with no loop.
        if (self.options.endTime && !self.options.loop) {
          self.getCurrentTime((seconds) => {
            if (seconds < self.options.endTime) {
              self.player.play();
            }
          });
        } else {
          self.player.play();
        }
      }
    });
  }

  pause() {
    const self = this;
    if (!self.player) {
      return;
    }

    self.player.getPaused().then((paused) => {
      if (!paused) {
        self.player.pause();
      }
    });
  }

  mute() {
    const self = this;
    if (!self.player || !self.player.setVolume) {
      return;
    }

    self.setVolume(0);
  }

  unmute() {
    const self = this;
    if (!self.player || !self.player.setVolume) {
      return;
    }

    // In case the default volume is 0, we have to set 100 when unmute.
    self.setVolume(self.options.volume || 100);
  }

  setVolume(volume = false) {
    const self = this;
    if (!self.player || typeof volume !== 'number' || !self.player.setVolume) {
      return;
    }

    self.player.setVolume(volume / 100);
  }

  getVolume(callback) {
    const self = this;
    if (!self.player) {
      callback(false);
      return;
    }

    if (self.player.getVolume) {
      self.player.getVolume().then((volume) => {
        callback(volume * 100);
      });
    }
  }

  getMuted(callback) {
    const self = this;
    if (!self.player) {
      callback(null);
      return;
    }

    if (self.player.getVolume) {
      self.player.getVolume().then((volume) => {
        callback(!!volume);
      });
    }
  }

  setCurrentTime(currentTime = false) {
    const self = this;
    if (!self.player || typeof currentTime !== 'number' || !self.player.setCurrentTime) {
      return;
    }

    self.player.setCurrentTime(currentTime);
  }

  getCurrentTime(callback) {
    const self = this;
    if (!self.player || !self.player.getCurrentTime) {
      return;
    }

    self.player.getCurrentTime().then((currentTime) => {
      callback(currentTime);
    });
  }

  getImageURL(callback) {
    const self = this;

    if (self.videoImage) {
      callback(self.videoImage);
      return;
    }

    // We should provide width to get HQ thumbnail URL.
    let width = global.innerWidth || 1920;
    if (global.devicePixelRatio) {
      width *= global.devicePixelRatio;
    }
    width = Math.min(width, 1920);

    let request = new XMLHttpRequest();
    // https://vimeo.com/api/oembed.json?url=https://vimeo.com/235212527
    request.open('GET', `https://vimeo.com/api/oembed.json?url=${self.url}&width=${width}`, true);
    request.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status >= 200 && this.status < 400) {
          // Success!
          const response = JSON.parse(this.responseText);

          if (response.thumbnail_url) {
            self.videoImage = response.thumbnail_url;
            callback(self.videoImage);
          }
        } else {
          // Error :(
        }
      }
    };
    request.send();
    request = null;
  }

  getVideo(callback) {
    const self = this;

    // return generated video block
    if (self.$video) {
      callback(self.$video);
      return;
    }

    // generate new video block
    onAPIready(() => {
      let hiddenDiv;
      if (!self.$video) {
        hiddenDiv = document.createElement('div');
        hiddenDiv.style.display = 'none';
      }

      self.playerOptions = {
        // GDPR Compliance.
        dnt: 1,
        id: self.videoID,
        autopause: 0,
        transparent: 0,
        autoplay: self.options.autoplay ? 1 : 0,
        loop: self.options.loop ? 1 : 0,
        muted: self.options.mute || self.options.volume === 0 ? 1 : 0,
      };

      // private video hash
      const urlHash = self.constructor.parseURLHash(self.url);
      if (urlHash) {
        self.playerOptions.h = urlHash;
      }

      // hide controls
      if (!self.options.showControls) {
        self.playerOptions.controls = 0;
      }

      // enable background option
      if (!self.options.showControls && self.options.loop && self.options.autoplay) {
        self.playerOptions.background = 1;
      }

      if (!self.$video) {
        let playerOptionsString = '';
        Object.keys(self.playerOptions).forEach((key) => {
          if (playerOptionsString !== '') {
            playerOptionsString += '&';
          }
          playerOptionsString += `${key}=${encodeURIComponent(self.playerOptions[key])}`;
        });

        // we need to create iframe manually because when we create it using API
        // js events won't triggers after iframe moved to another place
        self.$video = document.createElement('iframe');
        self.$video.setAttribute('id', self.playerID);
        self.$video.setAttribute(
          'src',
          `https://player.vimeo.com/video/${self.videoID}?${playerOptionsString}`
        );
        self.$video.setAttribute('frameborder', '0');
        self.$video.setAttribute('mozallowfullscreen', '');
        self.$video.setAttribute('allowfullscreen', '');
        self.$video.setAttribute('title', 'Vimeo video player');

        // add accessibility attributes
        if (self.options.accessibilityHidden) {
          self.$video.setAttribute('tabindex', '-1');
          self.$video.setAttribute('aria-hidden', 'true');
        }

        hiddenDiv.appendChild(self.$video);
        document.body.appendChild(hiddenDiv);
      }
      self.player = self.player || new global.Vimeo.Player(self.$video, self.playerOptions);

      // Since Vimeo removed the `volume` parameter, we have to set it manually.
      if (!self.options.mute && typeof self.options.volume === 'number') {
        self.setVolume(self.options.volume);
      }

      // set current time for autoplay
      if (self.options.startTime && self.options.autoplay) {
        self.player.setCurrentTime(self.options.startTime);
      }

      // get video width and height
      self.player.getVideoWidth().then((width) => {
        self.videoWidth = width || 1280;
      });
      self.player.getVideoHeight().then((height) => {
        self.videoHeight = height || 720;
      });

      // events
      let vmStarted;
      self.player.on('timeupdate', (e) => {
        if (!vmStarted) {
          self.fire('started', e);
          vmStarted = 1;
        }

        self.fire('timeupdate', e);

        // check for end of video and play again or stop
        if (self.options.endTime && e.seconds >= self.options.endTime) {
          if (self.options.loop) {
            self.play(self.options.startTime);
          } else {
            self.pause();
          }
        }
      });
      self.player.on('play', (e) => {
        self.fire('play', e);

        // check for the start time and start with it
        if (self.options.startTime && e.seconds === 0) {
          self.play(self.options.startTime);
        }
      });
      self.player.on('pause', (e) => {
        self.fire('pause', e);
      });
      self.player.on('ended', (e) => {
        self.fire('ended', e);
      });
      self.player.on('loaded', (e) => {
        self.fire('ready', e);
      });
      self.player.on('volumechange', (e) => {
        self.getVolume((volume) => {
          self.options.volume = volume;
        });
        self.fire('volumechange', e);
      });
      self.player.on('error', (e) => {
        self.fire('error', e);
      });

      callback(self.$video);
    });
  }
}

export default VideoWorkerVimeo;
