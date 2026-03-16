// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';

import VideoWorkerLocal from '../src/providers/local';
import VideoWorker from '../src/video-worker';

describe('local provider DOM baseline', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('creates a video element with expected attributes and sources', () => {
    const video = new VideoWorkerLocal('mp4:./clip.mp4,ogv:./clip.ogv', {
      accessibilityHidden: true,
      loop: true,
      mute: true,
      showControls: false,
      volume: 25,
    });

    let element: HTMLVideoElement | undefined;
    video.getVideo((node) => {
      element = node;
    });

    expect(element).toBeInstanceOf(HTMLVideoElement);
    expect(element?.id).toBe(video.playerID);
    expect(element?.controls).toBe(false);
    expect(element?.loop).toBe(true);
    expect(element?.muted).toBe(true);
    expect(element?.getAttribute('playsinline')).toBe('');
    expect(element?.getAttribute('webkit-playsinline')).toBe('');
    expect(element?.getAttribute('tabindex')).toBe('-1');
    expect(element?.getAttribute('aria-hidden')).toBe('true');
    expect(element?.querySelectorAll('source')).toHaveLength(2);
    expect(
      Array.from(element?.querySelectorAll('source') ?? []).map((source) => source.type)
    ).toEqual(['video/mp4', 'video/ogg']);
  });

  it('returns the same DOM node on subsequent getVideo calls', () => {
    const video = new VideoWorker('mp4:./clip.mp4');

    let first: HTMLVideoElement | undefined;
    let second: HTMLVideoElement | undefined;

    video.getVideo((node) => {
      first = node as HTMLVideoElement;
    });
    video.getVideo((node) => {
      second = node as HTMLVideoElement;
    });

    expect(second).toBe(first);
  });
});
