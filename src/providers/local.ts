import BaseClass from '../base-class';
import type { ValueCallback, VideoWorkerVideoSources } from '../types';

class VideoWorkerLocal extends BaseClass {
  type = 'local';

  player?: HTMLVideoElement;

  $video?: HTMLVideoElement;

  static parseURL(url: string): VideoWorkerVideoSources | false {
    const videoFormats = url.split(/,(?=mp4:|webm:|ogv:|ogg:)/);
    const result: VideoWorkerVideoSources = {};
    let ready = 0;

    videoFormats.forEach((value) => {
      const match = value.match(/^(mp4|webm|ogv|ogg):(.*)/);
      if (match?.[1] && match[2]) {
        const key = match[1] === 'ogv' ? 'ogg' : match[1];
        result[key as keyof VideoWorkerVideoSources] = match[2];
        ready = 1;
      }
    });

    return ready ? result : false;
  }

  play(start?: number): void {
    if (!this.player) {
      return;
    }

    if (typeof start !== 'undefined') {
      this.player.currentTime = start;
    }

    if (this.player.paused) {
      // Don't play if video is already ended and with no loop.
      if (this.options.endTime && !this.options.loop) {
        this.getCurrentTime((seconds) => {
          if (seconds < this.options.endTime) {
            void this.player?.play();
          }
        });
      } else {
        void this.player.play();
      }
    }
  }

  pause(): void {
    if (!this.player || this.player.paused) {
      return;
    }

    this.player.pause();
  }

  mute(): void {
    if (!this.player || !this.$video) {
      return;
    }

    this.$video.muted = true;
  }

  unmute(): void {
    if (!this.player || !this.$video) {
      return;
    }

    this.$video.muted = false;
  }

  setVolume(volume: number | false = false): void {
    if (!this.player || !this.$video || typeof volume !== 'number') {
      return;
    }

    this.$video.volume = volume / 100;
  }

  getVolume(callback: ValueCallback<number | false>): void {
    if (!this.player || !this.$video) {
      callback(false);
      return;
    }

    callback(this.$video.volume * 100);
  }

  getMuted(callback: ValueCallback<boolean | null>): void {
    if (!this.player || !this.$video) {
      callback(null);
      return;
    }

    callback(this.$video.muted);
  }

  setCurrentTime(currentTime: number | false = false): void {
    if (!this.player || !this.$video || typeof currentTime !== 'number') {
      return;
    }

    this.$video.currentTime = currentTime;
  }

  getCurrentTime(callback: ValueCallback<number>): void {
    if (!this.player) {
      return;
    }

    callback(this.player.currentTime);
  }

  getImageURL(callback: ValueCallback<string>): void {
    if (this.videoImage) {
      callback(this.videoImage);
    }
  }

  getVideo(callback: ValueCallback<HTMLVideoElement>): void {
    // return generated video block
    if (this.$video) {
      callback(this.$video);
      return;
    }

    // generate new video block
    let hiddenDiv: HTMLDivElement | undefined;
    if (!this.$video) {
      hiddenDiv = document.createElement('div');
      hiddenDiv.style.display = 'none';
    }

    function addSourceElement(element: HTMLVideoElement, src: string, type: string): void {
      const source = document.createElement('source');
      source.src = src;
      source.type = type;
      element.appendChild(source);
    }

    if (!this.$video && hiddenDiv) {
      this.$video = document.createElement('video');
      this.player = this.$video;

      // show controls
      if (this.options.showControls) {
        this.$video.controls = true;
      }

      // set volume
      if (typeof this.options.volume === 'number') {
        this.setVolume(this.options.volume);
      }

      // mute (it is required to mute after the volume set)
      if (this.options.mute) {
        this.mute();
      }

      // loop
      if (this.options.loop) {
        this.$video.loop = true;
      }

      // autoplay enable on mobile devices
      this.$video.setAttribute('playsinline', '');
      this.$video.setAttribute('webkit-playsinline', '');

      // add accessibility attributes
      if (this.options.accessibilityHidden) {
        this.$video.setAttribute('tabindex', '-1');
        this.$video.setAttribute('aria-hidden', 'true');
      }

      this.$video.setAttribute('id', this.playerID);
      hiddenDiv.appendChild(this.$video);
      document.body.appendChild(hiddenDiv);

      Object.keys(this.videoID as VideoWorkerVideoSources).forEach((key) => {
        const sourceValue = (this.videoID as VideoWorkerVideoSources)[
          key as keyof VideoWorkerVideoSources
        ];
        if (sourceValue) {
          addSourceElement(this.$video as HTMLVideoElement, sourceValue, `video/${key}`);
        }
      });
    }

    const player = this.player as HTMLVideoElement;
    let localStarted = false;
    player.addEventListener('playing', (event) => {
      if (!localStarted) {
        this.fire('started', event);
      }
      localStarted = true;
    });
    player.addEventListener('timeupdate', (event) => {
      this.fire('timeupdate', event);

      // check for end of video and play again or stop
      if (this.options.endTime && this.player && this.player.currentTime >= this.options.endTime) {
        if (this.options.loop) {
          this.play(this.options.startTime);
        } else {
          this.pause();
        }
      }
    });
    player.addEventListener('play', (event) => {
      this.fire('play', event);
    });
    player.addEventListener('pause', (event) => {
      this.fire('pause', event);
    });
    player.addEventListener('ended', (event) => {
      this.fire('ended', event);
    });
    player.addEventListener('loadedmetadata', (event) => {
      if (!this.player) {
        return;
      }

      // get video width and height
      this.videoWidth = this.player.videoWidth || 1280;
      this.videoHeight = this.player.videoHeight || 720;

      this.fire('ready', event);

      // autoplay
      if (this.options.autoplay) {
        this.play(this.options.startTime);
      }
    });
    player.addEventListener('volumechange', (event) => {
      this.getVolume((volume) => {
        if (typeof volume === 'number') {
          this.options.volume = volume;
        }
      });
      this.fire('volumechange', event);
    });
    player.addEventListener('error', (event) => {
      this.fire('error', event);
    });

    callback(this.$video as HTMLVideoElement);
  }
}

export default VideoWorkerLocal;
