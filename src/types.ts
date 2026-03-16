export interface VideoWorkerOptions {
  autoplay: boolean;
  loop: boolean;
  mute: boolean;
  volume: number;
  showControls: boolean;
  accessibilityHidden: boolean;
  startTime: number;
  endTime: number;
}

export type VideoWorkerOptionsInput = Partial<VideoWorkerOptions>;

export type VideoWorkerEventCallback = (...args: unknown[]) => void;

export type VideoWorkerVideoSources = Partial<Record<'mp4' | 'webm' | 'ogg', string>>;

export type ParsedVideoID = string | VideoWorkerVideoSources | false;

export type VideoWorkerElement = HTMLElement | HTMLIFrameElement | HTMLVideoElement;

export type ValueCallback<T> = (value: T) => void;

export interface YouTubePlayer {
  destroy?(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getVolume(): number;
  isMuted(): boolean;
  mute(): void;
  pauseVideo(): void;
  playVideo(): void;
  seekTo(seconds: number): void;
  setVolume(volume: number): void;
  unMute(): void;
}

export interface YouTubePlayerEvent {
  data?: number;
  target: YouTubePlayer;
}

export interface YouTubePlayerOptions {
  events: {
    onError: (event: YouTubePlayerEvent) => void;
    onReady: (event: YouTubePlayerEvent) => void;
    onStateChange: (event: YouTubePlayerEvent) => void;
  };
  host: string;
  playerVars: Record<string, number>;
  videoId: string;
}

export interface YouTubeNamespace {
  Player: new (id: string, options: YouTubePlayerOptions) => YouTubePlayer;
  PlayerState: {
    ENDED: number;
    PAUSED: number;
    PLAYING: number;
  };
  loaded: number;
}

export interface VimeoPlayerEvent {
  seconds: number;
}

export interface VimeoPlayer {
  destroy?(): Promise<void> | void;
  getCurrentTime(): Promise<number>;
  getPaused(): Promise<boolean>;
  getVideoHeight(): Promise<number>;
  getVideoWidth(): Promise<number>;
  getVolume(): Promise<number>;
  on(event: string, callback: (event: VimeoPlayerEvent) => void): void;
  pause(): Promise<void> | void;
  play(): Promise<void> | void;
  setCurrentTime(seconds: number): Promise<void> | void;
  setVolume(volume: number): Promise<void> | void;
}

export interface VimeoPlayerOptions {
  autoplay: 0 | 1;
  autopause: 0;
  background?: 1;
  controls?: 0;
  dnt: 1;
  h?: string;
  id: string;
  loop: 0 | 1;
  muted: 0 | 1;
  transparent: 0;
}

export interface VimeoNamespace {
  Player: new (element: HTMLIFrameElement, options: VimeoPlayerOptions) => VimeoPlayer;
}

export type VideoWorkerGlobal = typeof globalThis & {
  Vimeo?: VimeoNamespace;
  YT?: YouTubeNamespace;
  onYouTubeIframeAPIReady?: (() => void) | null;
};
