// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import VideoWorkerYoutube from '../src/providers/youtube';
import type { YouTubeNamespace, YouTubePlayerOptions } from '../src/types';

const testGlobal = globalThis as typeof globalThis & {
  YT?: YouTubeNamespace;
  onYouTubeIframeAPIReady?: (() => void) | null;
};

function createYouTubePlayerMock() {
  const state = {
    currentTime: 0,
    duration: 14,
    playerState: -1,
    volume: 55,
    muted: false,
  };

  class Player {
    id: string;

    options: YouTubePlayerOptions;

    element: HTMLElement | null;

    constructor(id: string, options: YouTubePlayerOptions) {
      this.id = id;
      this.options = options;
      this.element = document.getElementById(id);
      if (this.element) {
        this.element.setAttribute('width', '640');
        this.element.setAttribute('height', '360');
      }
    }

    getCurrentTime(): number {
      return state.currentTime;
    }

    getDuration(): number {
      return state.duration;
    }

    getPlayerState(): number {
      return state.playerState;
    }

    getVolume(): number {
      return state.volume;
    }

    isMuted(): boolean {
      return state.muted;
    }

    mute(): void {
      state.muted = true;
    }

    pauseVideo(): void {
      state.playerState = testGlobal.YT?.PlayerState.PAUSED ?? 2;
    }

    playVideo(): void {
      state.playerState = testGlobal.YT?.PlayerState.PLAYING ?? 1;
    }

    seekTo(seconds: number): void {
      state.currentTime = seconds;
    }

    setVolume(volume: number): void {
      state.volume = volume;
    }

    unMute(): void {
      state.muted = false;
    }
  }

  return { Player, state };
}

describe('youtube provider DOM coverage', () => {
  function getPlayerTarget(video: VideoWorkerYoutube) {
    const player = video.player;
    expect(player).toBeDefined();
    if (!player) {
      throw new Error('Expected YouTube player to be created');
    }

    return { target: player };
  }

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete testGlobal.YT;
    testGlobal.onYouTubeIframeAPIReady = null;
    vi.restoreAllMocks();
  });

  it('creates a player with expected options and accessibility attributes', () => {
    const { Player, state } = createYouTubePlayerMock();
    testGlobal.YT = {
      Player: Player as unknown as YouTubeNamespace['Player'],
      PlayerState: {
        ENDED: 0,
        PAUSED: 2,
        PLAYING: 1,
      },
      loaded: 1,
    };

    const video = new VideoWorkerYoutube('https://youtu.be/ab0TSkLe-E0', {
      accessibilityHidden: true,
      autoplay: true,
      loop: true,
      mute: true,
      showControls: false,
      startTime: 3,
    });

    let element: HTMLElement | undefined;
    video.getVideo((node) => {
      element = node;
    });

    expect(element).toBeInstanceOf(HTMLElement);
    expect(element?.id).toBe(video.playerID);
    expect(element?.getAttribute('tabindex')).toBe('-1');
    expect(element?.getAttribute('aria-hidden')).toBe('true');
    expect(video.videoWidth).toBe(640);
    expect(video.videoHeight).toBe(360);
    expect(video.playerOptions?.host).toBe('https://www.youtube.com');
    expect(video.playerOptions?.playerVars.controls).toBe(0);
    expect(video.playerOptions?.playerVars.disablekb).toBe(1);

    video.playerOptions?.events.onReady(getPlayerTarget(video));

    expect(state.muted).toBe(true);
    expect(state.currentTime).toBe(3);
    expect(state.playerState).toBe(testGlobal.YT.PlayerState.PLAYING);
    expect(video.options.endTime).toBe(0);
    expect(video.getEndTime()).toBeCloseTo(13.7);
  });

  it.each([
    ['https://www.youtube-nocookie.com', 'https://www.youtube-nocookie.com'],
    ['https://yt.example.com/', 'https://yt.example.com'],
  ])('serves the embed from youtubeHost %s', (youtubeHost, expected) => {
    const { Player } = createYouTubePlayerMock();
    testGlobal.YT = {
      Player: Player as unknown as YouTubeNamespace['Player'],
      PlayerState: { ENDED: 0, PAUSED: 2, PLAYING: 1 },
      loaded: 1,
    };

    const video = new VideoWorkerYoutube('https://youtu.be/ab0TSkLe-E0', { youtubeHost });
    video.getVideo(() => {});

    expect(video.playerOptions?.host).toBe(expected);
  });

  it('restarts a looped video before its natural end, using the current duration', () => {
    vi.useFakeTimers();

    const { Player, state } = createYouTubePlayerMock();
    testGlobal.YT = {
      Player: Player as unknown as YouTubeNamespace['Player'],
      PlayerState: {
        ENDED: 0,
        PAUSED: 2,
        PLAYING: 1,
      },
      loaded: 1,
    };

    // duration is unknown until the video metadata is loaded
    state.duration = 0;

    const video = new VideoWorkerYoutube('https://youtu.be/ab0TSkLe-E0', {
      loop: true,
      startTime: 3,
    });

    video.getVideo(() => {});
    video.playerOptions?.events.onReady(getPlayerTarget(video));

    expect(video.getEndTime()).toBe(0);

    const playEvent = { data: testGlobal.YT.PlayerState.PLAYING, ...getPlayerTarget(video) };
    state.playerState = testGlobal.YT.PlayerState.PLAYING;
    state.currentTime = 13.8;
    video.playerOptions?.events.onStateChange(playEvent);
    vi.advanceTimersByTime(150);

    // with no duration there is nothing to loop against, the video keeps playing
    expect(state.currentTime).toBe(13.8);

    // playback started, so the player reports the real duration now
    state.duration = 14;
    vi.advanceTimersByTime(150);

    expect(video.getEndTime()).toBeCloseTo(13.7);
    expect(state.currentTime).toBe(3);

    // the reported duration can be rounded up, so a video that ended on its own tells us
    // when it really ends and the next loops restart before that
    state.currentTime = 13.06;
    video.playerOptions?.events.onStateChange({
      data: testGlobal.YT.PlayerState.ENDED,
      ...getPlayerTarget(video),
    });

    expect(video.getEndTime()).toBeCloseTo(12.76);

    vi.useRealTimers();
  });

  it('forwards play, pause, ended, timeupdate and volumechange events', () => {
    vi.useFakeTimers();

    const { Player, state } = createYouTubePlayerMock();
    testGlobal.YT = {
      Player: Player as unknown as YouTubeNamespace['Player'],
      PlayerState: {
        ENDED: 0,
        PAUSED: 2,
        PLAYING: 1,
      },
      loaded: 1,
    };

    const video = new VideoWorkerYoutube('https://youtu.be/ab0TSkLe-E0', {
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

    const readyEvent = getPlayerTarget(video);
    video.playerOptions?.events.onReady(readyEvent);
    state.volume = 25;
    vi.advanceTimersByTime(150);

    expect(volumechange).toHaveBeenCalledWith(readyEvent);
    expect(video.options.volume).toBe(25);

    const playEvent = { data: testGlobal.YT.PlayerState.PLAYING, ...getPlayerTarget(video) };
    state.currentTime = 5;
    state.playerState = testGlobal.YT.PlayerState.PLAYING;
    video.playerOptions?.events.onStateChange(playEvent);
    vi.advanceTimersByTime(150);

    expect(started).toHaveBeenCalledWith(playEvent);
    expect(play).toHaveBeenCalledWith(playEvent);
    expect(timeupdate).toHaveBeenCalledWith(playEvent);
    expect(state.playerState).toBe(testGlobal.YT.PlayerState.PAUSED);

    const pauseEvent = { data: testGlobal.YT.PlayerState.PAUSED, ...getPlayerTarget(video) };
    video.playerOptions?.events.onStateChange(pauseEvent);
    expect(pause).toHaveBeenCalledWith(pauseEvent);

    const endedEvent = { data: testGlobal.YT.PlayerState.ENDED, ...getPlayerTarget(video) };
    video.playerOptions?.events.onStateChange(endedEvent);
    expect(ended).toHaveBeenCalledWith(endedEvent);

    vi.useRealTimers();
  });

  it('does not accumulate duplicate progress timers on repeated PLAYING events', () => {
    vi.useFakeTimers();

    const { Player, state } = createYouTubePlayerMock();
    testGlobal.YT = {
      Player: Player as unknown as YouTubeNamespace['Player'],
      PlayerState: {
        ENDED: 0,
        PAUSED: 2,
        PLAYING: 1,
      },
      loaded: 1,
    };

    const video = new VideoWorkerYoutube('https://youtu.be/ab0TSkLe-E0', {
      autoplay: false,
    });
    const timeupdate = vi.fn();
    video.on('timeupdate', timeupdate);
    video.getVideo(() => {});

    const playEvent = { data: testGlobal.YT.PlayerState.PLAYING, ...getPlayerTarget(video) };
    state.playerState = testGlobal.YT.PlayerState.PLAYING;

    video.playerOptions?.events.onStateChange(playEvent);
    video.playerOptions?.events.onStateChange(playEvent);
    vi.advanceTimersByTime(150);

    expect(timeupdate).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('clears polling intervals on destroy', () => {
    vi.useFakeTimers();

    const { Player, state } = createYouTubePlayerMock();
    testGlobal.YT = {
      Player: Player as unknown as YouTubeNamespace['Player'],
      PlayerState: {
        ENDED: 0,
        PAUSED: 2,
        PLAYING: 1,
      },
      loaded: 1,
    };

    const video = new VideoWorkerYoutube('https://youtu.be/ab0TSkLe-E0');
    const timeupdate = vi.fn();
    video.on('timeupdate', timeupdate);
    video.getVideo(() => {});
    video.playerOptions?.events.onReady(getPlayerTarget(video));

    const playEvent = { data: testGlobal.YT.PlayerState.PLAYING, ...getPlayerTarget(video) };
    state.playerState = testGlobal.YT.PlayerState.PLAYING;
    video.playerOptions?.events.onStateChange(playEvent);
    video.destroy();
    vi.advanceTimersByTime(300);

    expect(timeupdate).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
