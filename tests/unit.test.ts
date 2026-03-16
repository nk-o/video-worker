import { describe, expect, it, vi } from 'vitest';

import BaseClass from '../src/base-class';
import VideoWorkerLocal from '../src/providers/local';
import VideoWorkerVimeo from '../src/providers/vimeo';
import VideoWorkerYoutube from '../src/providers/youtube';
import Deferred from '../src/utils/deferred';
import extend from '../src/utils/extend';

describe('unit coverage baseline', () => {
  it('parses supported YouTube URLs', () => {
    expect(VideoWorkerYoutube.parseURL('https://www.youtube.com/watch?v=ab0TSkLe-E0')).toBe(
      'ab0TSkLe-E0'
    );
    expect(VideoWorkerYoutube.parseURL('https://youtu.be/ab0TSkLe-E0')).toBe('ab0TSkLe-E0');
    expect(VideoWorkerYoutube.parseURL('https://www.youtube.com/shorts/ab0TSkLe-E0')).toBe(
      'ab0TSkLe-E0'
    );
    expect(VideoWorkerYoutube.parseURL('https://www.youtube.com/watch?v=short')).toBe(false);
  });

  it('parses supported Vimeo URLs and private hashes', () => {
    expect(VideoWorkerVimeo.parseURL('https://vimeo.com/110138539')).toBe('110138539');
    expect(VideoWorkerVimeo.parseURL('https://player.vimeo.com/video/110138539')).toBe('110138539');
    expect(
      VideoWorkerVimeo.parseURLHash('https://player.vimeo.com/video/110138539?h=1a2b3c4d')
    ).toBe('1a2b3c4d');
    expect(VideoWorkerVimeo.parseURLHash('https://player.vimeo.com/video/110138539/1a2b3c4d')).toBe(
      '1a2b3c4d'
    );
    expect(VideoWorkerVimeo.parseURLHash('https://vimeo.com/110138539')).toBe(null);
  });

  it('parses local sources and normalizes ogv to ogg', () => {
    expect(VideoWorkerLocal.parseURL('mp4:./clip.mp4,ogv:./clip.ogv')).toEqual({
      mp4: './clip.mp4',
      ogg: './clip.ogv',
    });
    expect(VideoWorkerLocal.parseURL('invalid:./clip.mp4')).toBe(false);
  });

  it('extends target objects without overwriting with undefined', () => {
    const result = extend(
      { autoplay: false, volume: 100 },
      { autoplay: true },
      { autoplay: undefined, volume: 25 }
    );

    expect(result).toEqual({
      autoplay: true,
      volume: 25,
    });
  });

  it('executes deferred done and fail callbacks', () => {
    const deferred = new Deferred<[string]>();
    const done = vi.fn();
    const fail = vi.fn();

    deferred.done(done);
    deferred.fail(fail);
    deferred.resolve('ok');
    deferred.reject('error');

    expect(done).toHaveBeenCalledWith('ok');
    expect(fail).toHaveBeenCalledWith('error');
  });

  it('fires event callbacks with the instance as context', () => {
    const video = new BaseClass('invalid-url');
    const callback = vi.fn(function callback(this: BaseClass, payload: unknown) {
      expect(this).toBe(video);
      expect(payload).toBe('ready');
    });

    video.on('ready', callback);
    video.fire('ready', 'ready');

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
