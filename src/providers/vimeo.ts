import BaseClass from '../base-class';
import type {
  ValueCallback,
  VideoWorkerGlobal,
  VimeoNamespace,
  VimeoPlayer,
  VimeoPlayerEvent,
  VimeoPlayerOptions,
} from '../types';
import Deferred from '../utils/deferred';
import global from '../utils/global';

let VimeoAPIadded = 0;
let loadingVimeoPlayer = 0;
const loadingVimeoDefer = new Deferred<[string]>();

const videoGlobal = global as VideoWorkerGlobal;

function loadAPI(): void {
  if (VimeoAPIadded) {
    return;
  }

  VimeoAPIadded = 1;

  // Useful when Vimeo API added using RequireJS https://github.com/nk-o/video-worker/pull/7
  if (typeof videoGlobal.Vimeo !== 'undefined') {
    return;
  }

  const src = 'https://player.vimeo.com/api/player.js';

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
  if (typeof videoGlobal.Vimeo === 'undefined' && !loadingVimeoPlayer) {
    loadingVimeoPlayer = 1;
    const vimeoInterval = setInterval(() => {
      if (typeof videoGlobal.Vimeo !== 'undefined') {
        clearInterval(vimeoInterval);
        loadingVimeoDefer.resolve('done');
        callback();
      }
    }, 20);
  } else if (typeof videoGlobal.Vimeo !== 'undefined') {
    callback();
  } else {
    loadingVimeoDefer.done(() => {
      callback();
    });
  }
}

class VideoWorkerVimeo extends BaseClass {
  type = 'vimeo';

  player?: VimeoPlayer;

  $video?: HTMLIFrameElement;

  playerOptions?: VimeoPlayerOptions;

  static parseURL(url: string): string | false {
    const regExp =
      /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(regExp);
    return match?.[3] ? match[3] : false;
  }

  // Try to extract a hash for private videos from the URL.
  // Thanks to https://github.com/sampotts/plyr
  static parseURLHash(url: string): string | null {
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

  init(): void {
    super.init();

    loadAPI();
  }

  play(start?: number): void {
    if (!this.player) {
      return;
    }

    if (typeof start !== 'undefined') {
      void this.player.setCurrentTime(start);
    }

    this.player.getPaused().then((paused) => {
      if (paused) {
        // Don't play if video is already ended and with no loop.
        if (this.options.endTime && !this.options.loop) {
          this.getCurrentTime((seconds) => {
            if (seconds < this.options.endTime) {
              void this.player?.play();
            }
          });
        } else {
          void this.player?.play();
        }
      }
    });
  }

  pause(): void {
    if (!this.player) {
      return;
    }

    this.player.getPaused().then((paused) => {
      if (!paused) {
        void this.player?.pause();
      }
    });
  }

  mute(): void {
    if (!this.player || !this.player.setVolume) {
      return;
    }

    this.setVolume(0);
  }

  unmute(): void {
    if (!this.player || !this.player.setVolume) {
      return;
    }

    // In case the default volume is 0, we have to set 100 when unmute.
    this.setVolume(this.options.volume || 100);
  }

  setVolume(volume: number | false = false): void {
    if (!this.player || typeof volume !== 'number' || !this.player.setVolume) {
      return;
    }

    void this.player.setVolume(volume / 100);
  }

  getVolume(callback: ValueCallback<number | false>): void {
    if (!this.player) {
      callback(false);
      return;
    }

    if (this.player.getVolume) {
      this.player.getVolume().then((volume) => {
        callback(volume * 100);
      });
    }
  }

  getMuted(callback: ValueCallback<boolean | null>): void {
    if (!this.player) {
      callback(null);
      return;
    }

    if (this.player.getVolume) {
      this.player.getVolume().then((volume) => {
        callback(!!volume);
      });
    }
  }

  setCurrentTime(currentTime: number | false = false): void {
    if (!this.player || typeof currentTime !== 'number' || !this.player.setCurrentTime) {
      return;
    }

    void this.player.setCurrentTime(currentTime);
  }

  getCurrentTime(callback: ValueCallback<number>): void {
    if (!this.player || !this.player.getCurrentTime) {
      return;
    }

    this.player.getCurrentTime().then((currentTime) => {
      callback(currentTime);
    });
  }

  getImageURL(callback: ValueCallback<string>): void {
    if (this.videoImage) {
      callback(this.videoImage);
      return;
    }

    // We should provide width to get HQ thumbnail URL.
    let width = global.innerWidth || 1920;
    if (global.devicePixelRatio) {
      width *= global.devicePixelRatio;
    }
    width = Math.min(width, 1920);

    let request: XMLHttpRequest | null = new XMLHttpRequest();
    // https://vimeo.com/api/oembed.json?url=https://vimeo.com/235212527
    request.open('GET', `https://vimeo.com/api/oembed.json?url=${this.url}&width=${width}`, true);
    request.onreadystatechange = () => {
      if (!request || request.readyState !== 4) {
        return;
      }

      if (request.status >= 200 && request.status < 400) {
        // Success!
        const response = JSON.parse(request.responseText) as { thumbnail_url?: string };

        if (response.thumbnail_url) {
          this.videoImage = response.thumbnail_url;
          callback(this.videoImage);
        }
      }
    };
    request.send();
    request = null;
  }

  getVideo(callback: ValueCallback<HTMLIFrameElement>): void {
    // return generated video block
    if (this.$video) {
      callback(this.$video);
      return;
    }

    // generate new video block
    onAPIready(() => {
      let hiddenDiv: HTMLDivElement | undefined;
      if (!this.$video) {
        hiddenDiv = document.createElement('div');
        hiddenDiv.style.display = 'none';
      }

      this.playerOptions = {
        // GDPR Compliance.
        dnt: 1,
        id: String(this.videoID),
        autopause: 0,
        transparent: 0,
        autoplay: this.options.autoplay ? 1 : 0,
        loop: this.options.loop ? 1 : 0,
        muted: this.options.mute || this.options.volume === 0 ? 1 : 0,
      };

      // private video hash
      const urlHash = (this.constructor as typeof VideoWorkerVimeo).parseURLHash(this.url);
      if (urlHash) {
        this.playerOptions.h = urlHash;
      }

      // hide controls
      if (!this.options.showControls) {
        this.playerOptions.controls = 0;
      }

      // enable background option
      if (!this.options.showControls && this.options.loop && this.options.autoplay) {
        this.playerOptions.background = 1;
      }

      if (!this.$video && hiddenDiv) {
        let playerOptionsString = '';
        Object.keys(this.playerOptions).forEach((key) => {
          const optionKey = key as keyof VimeoPlayerOptions;
          const value = this.playerOptions?.[optionKey];
          if (typeof value === 'undefined') {
            return;
          }

          if (playerOptionsString !== '') {
            playerOptionsString += '&';
          }
          playerOptionsString += `${key}=${encodeURIComponent(String(value))}`;
        });

        // we need to create iframe manually because when we create it using API
        // js events won't triggers after iframe moved to another place
        this.$video = document.createElement('iframe');
        this.$video.setAttribute('id', this.playerID);
        this.$video.setAttribute(
          'src',
          `https://player.vimeo.com/video/${String(this.videoID)}?${playerOptionsString}`
        );
        this.$video.setAttribute('frameborder', '0');
        this.$video.setAttribute('mozallowfullscreen', '');
        this.$video.setAttribute('allowfullscreen', '');
        this.$video.setAttribute('title', 'Vimeo video player');

        // add accessibility attributes
        if (this.options.accessibilityHidden) {
          this.$video.setAttribute('tabindex', '-1');
          this.$video.setAttribute('aria-hidden', 'true');
        }

        hiddenDiv.appendChild(this.$video);
        document.body.appendChild(hiddenDiv);
      }
      this.player =
        this.player ||
        new (videoGlobal.Vimeo as VimeoNamespace).Player(
          this.$video as HTMLIFrameElement,
          this.playerOptions
        );

      // Since Vimeo removed the `volume` parameter, we have to set it manually.
      if (!this.options.mute && typeof this.options.volume === 'number') {
        this.setVolume(this.options.volume);
      }

      // set current time for autoplay
      if (this.options.startTime && this.options.autoplay) {
        void this.player.setCurrentTime(this.options.startTime);
      }

      // get video width and height
      this.player.getVideoWidth().then((widthValue) => {
        this.videoWidth = widthValue || 1280;
      });
      this.player.getVideoHeight().then((heightValue) => {
        this.videoHeight = heightValue || 720;
      });

      // events
      let vmStarted = false;
      this.player.on('timeupdate', (event: VimeoPlayerEvent) => {
        if (!vmStarted) {
          this.fire('started', event);
          vmStarted = true;
        }

        this.fire('timeupdate', event);

        // check for end of video and play again or stop
        if (this.options.endTime && event.seconds >= this.options.endTime) {
          if (this.options.loop) {
            this.play(this.options.startTime);
          } else {
            this.pause();
          }
        }
      });
      this.player.on('play', (event: VimeoPlayerEvent) => {
        this.fire('play', event);

        // check for the start time and start with it
        if (this.options.startTime && event.seconds === 0) {
          this.play(this.options.startTime);
        }
      });
      this.player.on('pause', (event: VimeoPlayerEvent) => {
        this.fire('pause', event);
      });
      this.player.on('ended', (event: VimeoPlayerEvent) => {
        this.fire('ended', event);
      });
      this.player.on('loaded', (event: VimeoPlayerEvent) => {
        this.fire('ready', event);
      });
      this.player.on('volumechange', (event: VimeoPlayerEvent) => {
        this.getVolume((volume) => {
          if (typeof volume === 'number') {
            this.options.volume = volume;
          }
        });
        this.fire('volumechange', event);
      });
      this.player.on('error', (event: VimeoPlayerEvent) => {
        this.fire('error', event);
      });

      callback(this.$video as HTMLIFrameElement);
    });
  }
}

export default VideoWorkerVimeo;
