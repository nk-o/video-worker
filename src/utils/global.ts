import type { VideoWorkerGlobal } from '../types';

/* eslint-disable import/no-mutable-exports */
/* eslint-disable no-restricted-globals */
let win: VideoWorkerGlobal;

if (typeof window !== 'undefined') {
  win = window as unknown as VideoWorkerGlobal;
} else if (typeof self !== 'undefined') {
  win = self as unknown as VideoWorkerGlobal;
} else {
  win = globalThis as VideoWorkerGlobal;
}

export default win;
