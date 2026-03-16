// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import VideoWorker from '../src/video-worker';

function createVimeoPlayerMock() {
  const state = {
    currentTime: 0,
    paused: true,
    volume: 0.5,
    width: 800,
    height: 450,
  };
  const listeners = {};

  class Player {
    constructor(element, options) {
      this.element = element;
      this.options = options;
    }

    getCurrentTime() {
      return Promise.resolve(state.currentTime);
    }

    getPaused() {
      return Promise.resolve(state.paused);
    }

    getVideoHeight() {
      return Promise.resolve(state.height);
    }

    getVideoWidth() {
      return Promise.resolve(state.width);
    }

    getVolume() {
      return Promise.resolve(state.volume);
    }

    on(event, callback) {
      listeners[event] = callback;
    }

    pause() {
      state.paused = true;
      return Promise.resolve();
    }

    play() {
      state.paused = false;
      return Promise.resolve();
    }

    setCurrentTime(seconds) {
      state.currentTime = seconds;
      return Promise.resolve();
    }

    setVolume(volume) {
      state.volume = volume;
      return Promise.resolve();
    }
  }

  return { Player, listeners, state };
}

describe('vimeo provider DOM coverage', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete globalThis.Vimeo;
    vi.restoreAllMocks();
  });

  it('creates an iframe with expected params, accessibility attributes and private hash', async () => {
    const { Player, state } = createVimeoPlayerMock();
    globalThis.Vimeo = { Player };

    const video = new VideoWorker('https://player.vimeo.com/video/110138539?h=1a2b3c4d', {
      accessibilityHidden: true,
      autoplay: true,
      loop: true,
      mute: false,
      showControls: false,
      startTime: 4,
      volume: 30,
    });

    let element;
    video.getVideo((node) => {
      element = node;
    });

    await Promise.resolve();

    expect(element).toBeInstanceOf(HTMLIFrameElement);
    expect(element.id).toBe(video.playerID);
    expect(element.getAttribute('tabindex')).toBe('-1');
    expect(element.getAttribute('aria-hidden')).toBe('true');
    expect(element.getAttribute('src')).toContain('h=1a2b3c4d');
    expect(element.getAttribute('src')).toContain('controls=0');
    expect(element.getAttribute('src')).toContain('background=1');
    expect(state.volume).toBeCloseTo(0.3);
    expect(state.currentTime).toBe(4);
    expect(video.videoWidth).toBe(800);
    expect(video.videoHeight).toBe(450);
  });

  it('forwards vimeo player events and enforces endTime behavior', async () => {
    const { Player, listeners, state } = createVimeoPlayerMock();
    globalThis.Vimeo = { Player };

    const video = new VideoWorker('https://vimeo.com/110138539', {
      endTime: 5,
      loop: false,
      startTime: 2,
    });
    const started = vi.fn();
    const play = vi.fn();
    const pause = vi.fn();
    const ended = vi.fn();
    const ready = vi.fn();
    const volumechange = vi.fn();
    const timeupdate = vi.fn();

    video.on('started', started);
    video.on('play', play);
    video.on('pause', pause);
    video.on('ended', ended);
    video.on('ready', ready);
    video.on('volumechange', volumechange);
    video.on('timeupdate', timeupdate);

    video.getVideo(() => {});
    await Promise.resolve();

    const playSpy = vi.spyOn(video, 'play');
    const pauseSpy = vi.spyOn(video, 'pause');

    listeners.loaded({ seconds: 0 });
    expect(ready).toHaveBeenCalled();

    listeners.play({ seconds: 0 });
    await Promise.resolve();
    expect(play).toHaveBeenCalled();
    expect(playSpy).toHaveBeenCalledWith(2);

    listeners.timeupdate({ seconds: 1 });
    expect(started).toHaveBeenCalled();
    expect(timeupdate).toHaveBeenCalled();

    state.volume = 0.5;
    listeners.volumechange({ seconds: 1 });
    await Promise.resolve();
    expect(volumechange).toHaveBeenCalled();
    expect(video.options.volume).toBe(50);

    listeners.timeupdate({ seconds: 5 });
    await Promise.resolve();
    expect(pauseSpy).toHaveBeenCalled();

    listeners.pause({ seconds: 5 });
    listeners.ended({ seconds: 5 });
    expect(pause).toHaveBeenCalled();
    expect(ended).toHaveBeenCalled();

    expect(state.paused).toBe(true);
  });
});
