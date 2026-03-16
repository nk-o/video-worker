// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import VideoWorker from '../src/video-worker';

describe('public API baseline', () => {
  afterEach(() => {
    delete VideoWorker.providers.CustomTestProvider;
  });

  it('returns the YouTube provider for supported YouTube URLs', () => {
    const video = new VideoWorker('https://www.youtube.com/watch?v=ab0TSkLe-E0');

    expect(video).toBeInstanceOf(VideoWorker.providers.Youtube);
    expect(video.type).toBe('youtube');
    expect(video.isValid()).toBe(true);
  });

  it('returns the Vimeo provider for supported Vimeo URLs', () => {
    const video = new VideoWorker('https://vimeo.com/110138539');

    expect(video).toBeInstanceOf(VideoWorker.providers.Vimeo);
    expect(video.type).toBe('vimeo');
    expect(video.isValid()).toBe(true);
  });

  it('returns the Local provider for self-hosted formats', () => {
    const video = new VideoWorker('mp4:./clip.mp4,webm:./clip.webm');

    expect(video).toBeInstanceOf(VideoWorker.providers.Local);
    expect(video.type).toBe('local');
    expect(video.isValid()).toBe(true);
  });

  it('falls back to the base class for invalid URLs', () => {
    const video = new VideoWorker('not-a-video-url');

    expect(video).toBeInstanceOf(VideoWorker.BaseClass);
    expect(video.type).toBe('none');
    expect(video.isValid()).toBe(false);
  });

  it('exposes the documented static extension points', () => {
    expect(VideoWorker.BaseClass).toBeTypeOf('function');
    expect(VideoWorker.providers).toMatchObject({
      Youtube: expect.any(Function),
      Vimeo: expect.any(Function),
      Local: expect.any(Function),
    });
  });

  it('allows custom providers to be registered without changing the factory API', () => {
    class CustomProvider extends VideoWorker.BaseClass {
      type = 'custom';

      static parseURL(url) {
        return url.startsWith('custom:') ? url.slice('custom:'.length) : false;
      }
    }

    VideoWorker.providers.CustomTestProvider = CustomProvider;

    const video = new VideoWorker('custom:demo');

    expect(video).toBeInstanceOf(CustomProvider);
    expect(video.type).toBe('custom');
    expect(video.isValid()).toBe(true);
  });

  it('merges user options on top of defaults', () => {
    const video = new VideoWorker('mp4:./clip.mp4', {
      autoplay: true,
      volume: 40,
    });

    expect(video.options).toMatchObject({
      autoplay: true,
      loop: false,
      mute: false,
      volume: 40,
      showControls: true,
      accessibilityHidden: false,
      startTime: 0,
      endTime: 0,
    });
  });

  it('keeps event subscription semantics stable', () => {
    const video = new VideoWorker.BaseClass('not-a-video-url');
    const first = vi.fn();
    const second = vi.fn();

    video.on('ready', first);
    video.on('ready', second);
    video.fire('ready', 'payload');

    expect(first).toHaveBeenCalledWith('payload');
    expect(second).toHaveBeenCalledWith('payload');

    video.off('ready', first);
    video.fire('ready', 'next');

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenLastCalledWith('next');

    video.off('ready');
    video.fire('ready', 'ignored');

    expect(second).toHaveBeenCalledTimes(2);
  });
});
