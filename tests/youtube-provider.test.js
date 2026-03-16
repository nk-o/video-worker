// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import VideoWorker from '../src/video-worker';

function createYouTubePlayerMock() {
  const state = {
    currentTime: 0,
    duration: 14,
    playerState: -1,
    volume: 55,
    muted: false,
  };

  class Player {
    constructor(id, options) {
      this.id = id;
      this.options = options;
      this.element = document.getElementById(id);
      if (this.element) {
        this.element.setAttribute('width', '640');
        this.element.setAttribute('height', '360');
      }
    }

    getCurrentTime() {
      return state.currentTime;
    }

    getDuration() {
      return state.duration;
    }

    getPlayerState() {
      return state.playerState;
    }

    getVolume() {
      return state.volume;
    }

    isMuted() {
      return state.muted;
    }

    mute() {
      state.muted = true;
    }

    pauseVideo() {
      state.playerState = globalThis.YT.PlayerState.PAUSED;
    }

    playVideo() {
      state.playerState = globalThis.YT.PlayerState.PLAYING;
    }

    seekTo(seconds) {
      state.currentTime = seconds;
    }

    setVolume(volume) {
      state.volume = volume;
    }

    unMute() {
      state.muted = false;
    }
  }

  return { Player, state };
}

describe('youtube provider DOM coverage', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete globalThis.YT;
    globalThis.onYouTubeIframeAPIReady = null;
    vi.restoreAllMocks();
  });

  it('creates a player with expected options and accessibility attributes', () => {
    const { Player, state } = createYouTubePlayerMock();
    globalThis.YT = {
      Player,
      PlayerState: {
        ENDED: 0,
        PAUSED: 2,
        PLAYING: 1,
      },
      loaded: 1,
    };

    const video = new VideoWorker('https://youtu.be/ab0TSkLe-E0', {
      accessibilityHidden: true,
      autoplay: true,
      loop: true,
      mute: true,
      showControls: false,
      startTime: 3,
    });

    let element;
    video.getVideo((node) => {
      element = node;
    });

    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.id).toBe(video.playerID);
    expect(element.getAttribute('tabindex')).toBe('-1');
    expect(element.getAttribute('aria-hidden')).toBe('true');
    expect(video.videoWidth).toBe(640);
    expect(video.videoHeight).toBe(360);
    expect(video.playerOptions.host).toBe('https://www.youtube-nocookie.com');
    expect(video.playerOptions.playerVars.controls).toBe(0);
    expect(video.playerOptions.playerVars.disablekb).toBe(1);

    video.playerOptions.events.onReady({ target: video.player });

    expect(state.muted).toBe(true);
    expect(state.currentTime).toBe(3);
    expect(state.playerState).toBe(globalThis.YT.PlayerState.PLAYING);
    expect(video.options.endTime).toBeCloseTo(13.9);
  });

  it('forwards play, pause, ended, timeupdate and volumechange events', () => {
    vi.useFakeTimers();

    const { Player, state } = createYouTubePlayerMock();
    globalThis.YT = {
      Player,
      PlayerState: {
        ENDED: 0,
        PAUSED: 2,
        PLAYING: 1,
      },
      loaded: 1,
    };

    const video = new VideoWorker('https://youtu.be/ab0TSkLe-E0', {
      endTime: 5,
      loop: false,
    });
    const started = vi.fn();
    const play = vi.fn();
    const pause = vi.fn();
    const ended = vi.fn();
    const timeupdate = vi.fn();
    const volumechange = vi.fn();

    video.on('started', started);
    video.on('play', play);
    video.on('pause', pause);
    video.on('ended', ended);
    video.on('timeupdate', timeupdate);
    video.on('volumechange', volumechange);

    video.getVideo(() => {});

    const readyEvent = { target: video.player };
    video.playerOptions.events.onReady(readyEvent);
    state.volume = 25;
    vi.advanceTimersByTime(150);

    expect(volumechange).toHaveBeenCalledWith(readyEvent);
    expect(video.options.volume).toBe(25);

    const playEvent = { data: globalThis.YT.PlayerState.PLAYING, target: video.player };
    state.currentTime = 5;
    state.playerState = globalThis.YT.PlayerState.PLAYING;
    video.playerOptions.events.onStateChange(playEvent);
    vi.advanceTimersByTime(150);

    expect(started).toHaveBeenCalledWith(playEvent);
    expect(play).toHaveBeenCalledWith(playEvent);
    expect(timeupdate).toHaveBeenCalledWith(playEvent);
    expect(state.playerState).toBe(globalThis.YT.PlayerState.PAUSED);

    const pauseEvent = { data: globalThis.YT.PlayerState.PAUSED, target: video.player };
    video.playerOptions.events.onStateChange(pauseEvent);
    expect(pause).toHaveBeenCalledWith(pauseEvent);

    const endedEvent = { data: globalThis.YT.PlayerState.ENDED, target: video.player };
    video.playerOptions.events.onStateChange(endedEvent);
    expect(ended).toHaveBeenCalledWith(endedEvent);

    vi.useRealTimers();
  });
});
