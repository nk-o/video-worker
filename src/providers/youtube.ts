import BaseClass from '../base-class';
import type {
  ValueCallback,
  VideoWorkerGlobal,
  YouTubeNamespace,
  YouTubePlayer,
  YouTubePlayerEvent,
  YouTubePlayerOptions,
} from '../types';
import Deferred from '../utils/deferred';
import global from '../utils/global';

let YoutubeAPIadded = 0;
let loadingYoutubePlayer = 0;
const loadingYoutubeDefer = new Deferred<[string]>();

const videoGlobal = global as VideoWorkerGlobal;

function loadAPI(): void {
  if (YoutubeAPIadded) {
    return;
  }

  YoutubeAPIadded = 1;

  const src = 'https://www.youtube.com/iframe_api';

  // add script in head section
  let tag: HTMLScriptElement | null = document.createElement('script');
  let head: HTMLHeadElement | null = document.getElementsByTagName('head')[0] || null;

  if (!head || !tag) {
    return;
  }

  tag.src = src;
  head.appendChild(tag);

  head = null;
  tag = null;
}

function onAPIready(callback: () => void): void {
  // Listen for global YT player callback
  if (
    (typeof videoGlobal.YT === 'undefined' || videoGlobal.YT.loaded === 0) &&
    !loadingYoutubePlayer
  ) {
    // Prevents Ready event from being called twice
    loadingYoutubePlayer = 1;

    // Creates deferred so, other players know when to wait.
    videoGlobal.onYouTubeIframeAPIReady = () => {
      videoGlobal.onYouTubeIframeAPIReady = null;
      loadingYoutubeDefer.resolve('done');
      callback();
    };
  } else if (typeof videoGlobal.YT === 'object' && videoGlobal.YT.loaded === 1) {
    callback();
  } else {
    loadingYoutubeDefer.done(() => {
      callback();
    });
  }
}

class VideoWorkerYoutube extends BaseClass {
  type = 'youtube';

  player?: YouTubePlayer;

  $video?: HTMLElement;

  playerOptions?: YouTubePlayerOptions;

  progressInterval?: ReturnType<typeof setInterval>;

  volumeChangeInterval?: ReturnType<typeof setInterval>;

  static parseURL(url: string): string | false {
    const regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[1].length === 11 ? match[1] : false;
  }

  init(): void {
    super.init();

    loadAPI();
  }

  play(start?: number): void {
    if (!this.player || !this.player.playVideo || !videoGlobal.YT) {
      return;
    }

    if (typeof start !== 'undefined') {
      this.player.seekTo(start || 0);
    }

    if (videoGlobal.YT.PlayerState.PLAYING !== this.player.getPlayerState()) {
      // Don't play if video is already ended and with no loop.
      if (this.options.endTime && !this.options.loop) {
        this.getCurrentTime((seconds) => {
          if (seconds < this.options.endTime) {
            this.player?.playVideo();
          }
        });
      } else {
        this.player.playVideo();
      }
    }
  }

  pause(): void {
    if (!this.player || !this.player.pauseVideo || !videoGlobal.YT) {
      return;
    }

    if (videoGlobal.YT.PlayerState.PLAYING === this.player.getPlayerState()) {
      this.player.pauseVideo();
    }
  }

  mute(): void {
    if (!this.player || !this.player.mute) {
      return;
    }

    this.player.mute();
  }

  unmute(): void {
    if (!this.player || !this.player.unMute) {
      return;
    }

    this.player.unMute();
  }

  setVolume(volume: number | false = false): void {
    if (!this.player || typeof volume !== 'number' || !this.player.setVolume) {
      return;
    }

    this.player.setVolume(volume);
  }

  getVolume(callback: ValueCallback<number | false>): void {
    if (!this.player) {
      callback(false);
      return;
    }

    if (this.player.getVolume) {
      callback(this.player.getVolume());
    }
  }

  getMuted(callback: ValueCallback<boolean | null>): void {
    if (!this.player) {
      callback(null);
      return;
    }

    if (this.player.isMuted) {
      callback(this.player.isMuted());
    }
  }

  setCurrentTime(currentTime: number | false = false): void {
    if (!this.player || typeof currentTime !== 'number' || !this.player.seekTo) {
      return;
    }

    this.player.seekTo(currentTime);
  }

  getCurrentTime(callback: ValueCallback<number>): void {
    if (!this.player || !this.player.getCurrentTime) {
      return;
    }

    callback(this.player.getCurrentTime());
  }

  getImageURL(callback: ValueCallback<string>): void {
    if (this.videoImage) {
      callback(this.videoImage);
      return;
    }

    const availableSizes = ['maxresdefault', 'sddefault', 'hqdefault', '0'];
    let step = 0;

    const tempImg = new Image();
    tempImg.onload = () => {
      // if no thumbnail, youtube add their own image with width = 120px
      if ((tempImg.naturalWidth || tempImg.width) !== 120 || step === availableSizes.length - 1) {
        // ok
        this.videoImage = `https://img.youtube.com/vi/${String(this.videoID)}/${availableSizes[step]}.jpg`;
        callback(this.videoImage);
      } else {
        // try another size
        step += 1;
        tempImg.src = `https://img.youtube.com/vi/${String(this.videoID)}/${availableSizes[step]}.jpg`;
      }
    };
    tempImg.src = `https://img.youtube.com/vi/${String(this.videoID)}/${availableSizes[step]}.jpg`;
  }

  getVideo(callback: ValueCallback<HTMLElement>): void {
    if (this.destroyed) {
      return;
    }

    // return generated video block
    if (this.$video) {
      callback(this.$video as HTMLElement);
      return;
    }

    // generate new video block
    onAPIready(() => {
      if (this.destroyed) {
        return;
      }

      let hiddenDiv: HTMLDivElement | undefined;
      if (!this.$video) {
        hiddenDiv = document.createElement('div');
        hiddenDiv.style.display = 'none';
      }

      this.playerOptions = {
        // GDPR Compliance.
        host: 'https://www.youtube-nocookie.com',
        videoId: String(this.videoID),
        playerVars: {
          autohide: 1,
          rel: 0,
          autoplay: 0,
          // autoplay enable on mobile devices
          playsinline: 1,
        },
        events: {
          onReady: (event: YouTubePlayerEvent) => {
            // mute
            if (this.options.mute) {
              event.target.mute();
            } else if (typeof this.options.volume === 'number') {
              event.target.setVolume(this.options.volume);
            }

            // autoplay
            if (this.options.autoplay) {
              this.play(this.options.startTime);
            }
            this.fire('ready', event);

            // For seamless loops, set the endTime to 0.1 seconds less than the video's duration
            // https://github.com/nk-o/video-worker/issues/2
            if (this.options.loop && !this.options.endTime && this.player) {
              const secondsOffset = 0.1;
              this.options.endTime = this.player.getDuration() - secondsOffset;
            }

            // volumechange
            if (this.volumeChangeInterval) {
              clearInterval(this.volumeChangeInterval);
            }
            this.volumeChangeInterval = setInterval(() => {
              this.getVolume((volume) => {
                if (typeof volume === 'number' && this.options.volume !== volume) {
                  this.options.volume = volume;
                  this.fire('volumechange', event);
                }
              });
            }, 150);
          },
          onStateChange: () => {},
          onError: (event: YouTubePlayerEvent) => {
            this.fire('error', event);
          },
        },
      };

      // hide controls
      if (!this.options.showControls) {
        this.playerOptions.playerVars.iv_load_policy = 3;
        this.playerOptions.playerVars.modestbranding = 1;
        this.playerOptions.playerVars.controls = 0;
        this.playerOptions.playerVars.showinfo = 0;
        this.playerOptions.playerVars.disablekb = 1;
      }

      // events
      let ytStarted = false;
      this.playerOptions.events.onStateChange = (event: YouTubePlayerEvent) => {
        if (!videoGlobal.YT || !this.player) {
          return;
        }

        // loop
        if (this.options.loop && event.data === videoGlobal.YT.PlayerState.ENDED) {
          this.play(this.options.startTime);
        }
        if (!ytStarted && event.data === videoGlobal.YT.PlayerState.PLAYING) {
          ytStarted = true;
          this.fire('started', event);
        }
        if (event.data === videoGlobal.YT.PlayerState.PLAYING) {
          this.fire('play', event);
        }
        if (event.data === videoGlobal.YT.PlayerState.PAUSED) {
          this.fire('pause', event);
        }
        if (event.data === videoGlobal.YT.PlayerState.ENDED) {
          this.fire('ended', event);
        }

        // progress check
        if (event.data === videoGlobal.YT.PlayerState.PLAYING) {
          if (this.progressInterval) {
            clearInterval(this.progressInterval);
          }
          this.progressInterval = setInterval(() => {
            if (!this.player) {
              return;
            }

            this.fire('timeupdate', event);

            // check for end of video and play again or stop
            if (this.options.endTime && this.player.getCurrentTime() >= this.options.endTime) {
              if (this.options.loop) {
                this.play(this.options.startTime);
              } else {
                this.pause();
              }
            }
          }, 150);
        } else if (this.progressInterval) {
          clearInterval(this.progressInterval);
          this.progressInterval = undefined;
        }
      };

      const firstInit = !this.$video;
      if (firstInit && hiddenDiv) {
        this.hiddenContainer = hiddenDiv;
        const div = document.createElement('div');
        div.setAttribute('id', this.playerID);
        hiddenDiv.appendChild(div);
        document.body.appendChild(hiddenDiv);
      }
      this.player =
        this.player ||
        new (videoGlobal.YT as YouTubeNamespace).Player(this.playerID, this.playerOptions);
      if (firstInit) {
        this.$video = document.getElementById(this.playerID) as HTMLElement;

        // add accessibility attributes
        if (this.$video && this.options.accessibilityHidden) {
          this.$video.setAttribute('tabindex', '-1');
          this.$video.setAttribute('aria-hidden', 'true');
        }

        // get video width and height
        if (this.$video) {
          this.videoWidth = parseInt(this.$video.getAttribute('width') || '1280', 10) || 1280;
          this.videoHeight = parseInt(this.$video.getAttribute('height') || '720', 10) || 720;
        }
      }

      callback(this.$video as HTMLElement);
    });
  }

  destroy(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = undefined;
    }

    if (this.volumeChangeInterval) {
      clearInterval(this.volumeChangeInterval);
      this.volumeChangeInterval = undefined;
    }

    if (this.player?.destroy) {
      this.player.destroy();
    }

    super.destroy();
  }
}

export default VideoWorkerYoutube;
