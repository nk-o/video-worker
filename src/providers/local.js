import BaseClass from '../base-class';

class VideoWorkerLocal extends BaseClass {
  type = 'local';

  static parseURL(url) {
    // eslint-disable-next-line no-useless-escape
    const videoFormats = url.split(/,(?=mp4\:|webm\:|ogv\:|ogg\:)/);
    const result = {};
    let ready = 0;

    videoFormats.forEach((val) => {
      // eslint-disable-next-line no-useless-escape
      const match = val.match(/^(mp4|webm|ogv|ogg)\:(.*)/);
      if (match && match[1] && match[2]) {
        // eslint-disable-next-line prefer-destructuring
        result[match[1] === 'ogv' ? 'ogg' : match[1]] = match[2];
        ready = 1;
      }
    });

    return ready ? result : false;
  }

  play(start) {
    const self = this;
    if (!self.player) {
      return;
    }

    if (typeof start !== 'undefined') {
      self.player.currentTime = start;
    }

    if (self.player.paused) {
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
  }

  pause() {
    const self = this;
    if (!self.player || self.player.paused) {
      return;
    }

    self.player.pause();
  }

  mute() {
    const self = this;
    if (!self.player) {
      return;
    }

    self.$video.muted = true;
  }

  unmute() {
    const self = this;
    if (!self.player) {
      return;
    }

    self.$video.muted = false;
  }

  setVolume(volume = false) {
    const self = this;
    if (!self.player || typeof volume !== 'number') {
      return;
    }

    self.$video.volume = volume / 100;
  }

  getVolume(callback) {
    const self = this;
    if (!self.player) {
      callback(false);
      return;
    }

    callback(self.$video.volume * 100);
  }

  getMuted(callback) {
    const self = this;
    if (!self.player) {
      callback(null);
      return;
    }

    callback(self.$video.muted);
  }

  setCurrentTime(currentTime = false) {
    const self = this;
    if (!self.player || typeof currentTime !== 'number') {
      return;
    }

    self.$video.currentTime = currentTime;
  }

  getCurrentTime(callback) {
    const self = this;
    if (!self.player) {
      return;
    }

    callback(self.player.currentTime);
  }

  getImageURL(callback) {
    const self = this;

    if (self.videoImage) {
      callback(self.videoImage);
    }
  }

  getVideo(callback) {
    const self = this;

    // return generated video block
    if (self.$video) {
      callback(self.$video);
      return;
    }

    // generate new video block
    let hiddenDiv;
    if (!self.$video) {
      hiddenDiv = document.createElement('div');
      hiddenDiv.style.display = 'none';
    }

    function addSourceElement(element, src, type) {
      const source = document.createElement('source');
      source.src = src;
      source.type = type;
      element.appendChild(source);
    }

    if (!self.$video) {
      self.$video = document.createElement('video');
      self.player = self.$video;

      // show controls
      if (self.options.showControls) {
        self.$video.controls = true;
      }

      // set volume
      if (typeof self.options.volume === 'number') {
        self.setVolume(self.options.volume);
      }

      // mute (it is required to mute after the volume set)
      if (self.options.mute) {
        self.mute();
      }

      // loop
      if (self.options.loop) {
        self.$video.loop = true;
      }

      // autoplay enable on mobile devices
      self.$video.setAttribute('playsinline', '');
      self.$video.setAttribute('webkit-playsinline', '');

      // add accessibility attributes
      if (self.options.accessibilityHidden) {
        self.$video.setAttribute('tabindex', '-1');
        self.$video.setAttribute('aria-hidden', 'true');
      }

      self.$video.setAttribute('id', self.playerID);
      hiddenDiv.appendChild(self.$video);
      document.body.appendChild(hiddenDiv);

      Object.keys(self.videoID).forEach((key) => {
        addSourceElement(self.$video, self.videoID[key], `video/${key}`);
      });
    }

    let locStarted;
    self.player.addEventListener('playing', (e) => {
      if (!locStarted) {
        self.fire('started', e);
      }
      locStarted = 1;
    });
    self.player.addEventListener('timeupdate', function (e) {
      self.fire('timeupdate', e);

      // check for end of video and play again or stop
      if (self.options.endTime && this.currentTime >= self.options.endTime) {
        if (self.options.loop) {
          self.play(self.options.startTime);
        } else {
          self.pause();
        }
      }
    });
    self.player.addEventListener('play', (e) => {
      self.fire('play', e);
    });
    self.player.addEventListener('pause', (e) => {
      self.fire('pause', e);
    });
    self.player.addEventListener('ended', (e) => {
      self.fire('ended', e);
    });
    self.player.addEventListener('loadedmetadata', function () {
      // get video width and height
      self.videoWidth = this.videoWidth || 1280;
      self.videoHeight = this.videoHeight || 720;

      self.fire('ready');

      // autoplay
      if (self.options.autoplay) {
        self.play(self.options.startTime);
      }
    });
    self.player.addEventListener('volumechange', (e) => {
      self.getVolume((volume) => {
        self.options.volume = volume;
      });
      self.fire('volumechange', e);
    });
    self.player.addEventListener('error', (e) => {
      self.fire('error', e);
    });

    callback(self.$video);
  }
}

export default VideoWorkerLocal;
