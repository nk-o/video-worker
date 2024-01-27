import BaseClass from '../base-class';
import global from '../utils/global';
import Deferred from '../utils/deferred';

let YoutubeAPIadded = 0;
let loadingYoutubePlayer = 0;
const loadingYoutubeDefer = new Deferred();

function loadAPI() {
  if (YoutubeAPIadded) {
    return;
  }

  YoutubeAPIadded = true;

  const src = 'https://www.youtube.com/iframe_api';

  if (!src) {
    return;
  }

  // add script in head section
  let tag = document.createElement('script');
  let head = document.getElementsByTagName('head')[0];
  tag.src = src;

  head.appendChild(tag);

  head = null;
  tag = null;
}

function onAPIready(callback) {
  // Listen for global YT player callback
  if ((typeof global.YT === 'undefined' || global.YT.loaded === 0) && !loadingYoutubePlayer) {
    // Prevents Ready event from being called twice
    loadingYoutubePlayer = 1;

    // Creates deferred so, other players know when to wait.
    global.onYouTubeIframeAPIReady = function () {
      global.onYouTubeIframeAPIReady = null;
      loadingYoutubeDefer.resolve('done');
      callback();
    };
  } else if (typeof global.YT === 'object' && global.YT.loaded === 1) {
    callback();
  } else {
    loadingYoutubeDefer.done(() => {
      callback();
    });
  }
}

class VideoWorkerYoutube extends BaseClass {
  type = 'youtube';

  static parseURL(url) {
    // eslint-disable-next-line no-useless-escape
    const regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[1].length === 11 ? match[1] : false;
  }

  init() {
    super.init();

    loadAPI();
  }

  play(start) {
    const self = this;
    if (!self.player || !self.player.playVideo) {
      return;
    }

    if (typeof start !== 'undefined') {
      self.player.seekTo(start || 0);
    }

    if (global.YT.PlayerState.PLAYING !== self.player.getPlayerState()) {
      // Don't play if video is already ended and with no loop.
      if (self.options.endTime && !self.options.loop) {
        self.getCurrentTime((seconds) => {
          if (seconds < self.options.endTime) {
            self.player.playVideo();
          }
        });
      } else {
        self.player.playVideo();
      }
    }
  }

  pause() {
    const self = this;
    if (!self.player || !self.player.pauseVideo) {
      return;
    }

    if (global.YT.PlayerState.PLAYING === self.player.getPlayerState()) {
      self.player.pauseVideo();
    }
  }

  mute() {
    const self = this;
    if (!self.player || !self.player.mute) {
      return;
    }

    self.player.mute();
  }

  unmute() {
    const self = this;
    if (!self.player || !self.player.unMute) {
      return;
    }

    self.player.unMute();
  }

  setVolume(volume = false) {
    const self = this;
    if (!self.player || typeof volume !== 'number' || !self.player.setVolume) {
      return;
    }

    self.player.setVolume(volume);
  }

  getVolume(callback) {
    const self = this;
    if (!self.player) {
      callback(false);
      return;
    }

    if (self.player.getVolume) {
      callback(self.player.getVolume());
    }
  }

  getMuted(callback) {
    const self = this;
    if (!self.player) {
      callback(null);
      return;
    }

    if (self.player.isMuted) {
      callback(self.player.isMuted());
    }
  }

  setCurrentTime(currentTime = false) {
    const self = this;
    if (!self.player || typeof currentTime !== 'number' || !self.player.seekTo) {
      return;
    }

    self.player.seekTo(currentTime);
  }

  getCurrentTime(callback) {
    const self = this;
    if (!self.player || !self.player.getCurrentTime) {
      return;
    }

    callback(self.player.getCurrentTime());
  }

  getImageURL(callback) {
    const self = this;

    if (self.videoImage) {
      callback(self.videoImage);
      return;
    }

    const availableSizes = ['maxresdefault', 'sddefault', 'hqdefault', '0'];
    let step = 0;

    const tempImg = new Image();
    tempImg.onload = function () {
      // if no thumbnail, youtube add their own image with width = 120px
      if ((this.naturalWidth || this.width) !== 120 || step === availableSizes.length - 1) {
        // ok
        self.videoImage = `https://img.youtube.com/vi/${self.videoID}/${availableSizes[step]}.jpg`;
        callback(self.videoImage);
      } else {
        // try another size
        step += 1;
        this.src = `https://img.youtube.com/vi/${self.videoID}/${availableSizes[step]}.jpg`;
      }
    };
    tempImg.src = `https://img.youtube.com/vi/${self.videoID}/${availableSizes[step]}.jpg`;
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
        host: 'https://www.youtube-nocookie.com',
        videoId: self.videoID,
        playerVars: {
          autohide: 1,
          rel: 0,
          autoplay: 0,
          // autoplay enable on mobile devices
          playsinline: 1,
        },
      };

      // hide controls
      if (!self.options.showControls) {
        self.playerOptions.playerVars.iv_load_policy = 3;
        self.playerOptions.playerVars.modestbranding = 1;
        self.playerOptions.playerVars.controls = 0;
        self.playerOptions.playerVars.showinfo = 0;
        self.playerOptions.playerVars.disablekb = 1;
      }

      // events
      let ytStarted;
      let ytProgressInterval;
      self.playerOptions.events = {
        onReady(e) {
          // mute
          if (self.options.mute) {
            e.target.mute();
          } else if (typeof self.options.volume === 'number') {
            e.target.setVolume(self.options.volume);
          }

          // autoplay
          if (self.options.autoplay) {
            self.play(self.options.startTime);
          }
          self.fire('ready', e);

          // For seamless loops, set the endTime to 0.1 seconds less than the video's duration
          // https://github.com/nk-o/video-worker/issues/2
          if (self.options.loop && !self.options.endTime) {
            const secondsOffset = 0.1;
            self.options.endTime = self.player.getDuration() - secondsOffset;
          }

          // volumechange
          setInterval(() => {
            self.getVolume((volume) => {
              if (self.options.volume !== volume) {
                self.options.volume = volume;
                self.fire('volumechange', e);
              }
            });
          }, 150);
        },
        onStateChange(e) {
          // loop
          if (self.options.loop && e.data === global.YT.PlayerState.ENDED) {
            self.play(self.options.startTime);
          }
          if (!ytStarted && e.data === global.YT.PlayerState.PLAYING) {
            ytStarted = 1;
            self.fire('started', e);
          }
          if (e.data === global.YT.PlayerState.PLAYING) {
            self.fire('play', e);
          }
          if (e.data === global.YT.PlayerState.PAUSED) {
            self.fire('pause', e);
          }
          if (e.data === global.YT.PlayerState.ENDED) {
            self.fire('ended', e);
          }

          // progress check
          if (e.data === global.YT.PlayerState.PLAYING) {
            ytProgressInterval = setInterval(() => {
              self.fire('timeupdate', e);

              // check for end of video and play again or stop
              if (self.options.endTime && self.player.getCurrentTime() >= self.options.endTime) {
                if (self.options.loop) {
                  self.play(self.options.startTime);
                } else {
                  self.pause();
                }
              }
            }, 150);
          } else {
            clearInterval(ytProgressInterval);
          }
        },
        onError(e) {
          self.fire('error', e);
        },
      };

      const firstInit = !self.$video;
      if (firstInit) {
        const div = document.createElement('div');
        div.setAttribute('id', self.playerID);
        hiddenDiv.appendChild(div);
        document.body.appendChild(hiddenDiv);
      }
      self.player = self.player || new global.YT.Player(self.playerID, self.playerOptions);
      if (firstInit) {
        self.$video = document.getElementById(self.playerID);

        // add accessibility attributes
        if (self.options.accessibilityHidden) {
          self.$video.setAttribute('tabindex', '-1');
          self.$video.setAttribute('aria-hidden', 'true');
        }

        // get video width and height
        self.videoWidth = parseInt(self.$video.getAttribute('width'), 10) || 1280;
        self.videoHeight = parseInt(self.$video.getAttribute('height'), 10) || 720;
      }

      callback(self.$video);
    });
  }
}

export default VideoWorkerYoutube;
