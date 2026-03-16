# Video Worker <!-- omit in toc -->

![video-worker.min.js](https://img.badgesize.io/nk-o/video-worker/master/dist/video-worker.min.js?compression=gzip)

API wrapper for YouTube, Vimeo, and self-hosted videos.

## Table of Contents <!-- omit in toc -->

- [Install](#install)
- [Import VideoWorker](#import-videoworker)
  - [ESM](#esm)
  - [TypeScript](#typescript)
  - [ESM CDN](#esm-cdn)
  - [UMD](#umd)
  - [UMD CDN](#umd-cdn)
  - [CommonJS](#commonjs)
- [Use VideoWorker](#use-videoworker)
- [Options](#options)
- [Events](#events)
- [Methods](#methods)
- [Custom Providers](#custom-providers)
- [For Developers](#for-developers)

## Install

```bash
npm install video-worker
```

Video Worker ships with:

- ESM and CommonJS entry points
- UMD bundles in `dist/`
- TypeScript declarations in `dist/types/`
- Published `src/` files for compatibility with consumers that still inspect or bundle source paths

## Import VideoWorker

### ESM

```javascript
import VideoWorker from 'video-worker';
```

### TypeScript

```ts
import VideoWorker, { type VideoWorkerOptions } from 'video-worker';

const options: VideoWorkerOptions = {
  autoplay: false,
  loop: false,
  mute: false,
  volume: 100,
  showControls: true,
  accessibilityHidden: false,
  startTime: 0,
  endTime: 0,
};

const video = new VideoWorker('https://www.youtube.com/watch?v=ab0TSkLe-E0', options);
```

### ESM CDN

```html
<script type="module">
  import VideoWorker from "https://cdn.jsdelivr.net/npm/video-worker@2/+esm";
</script>
```

### UMD

VideoWorker can also be used in a traditional browser setup through `window.VideoWorker`.

```html
<script src="video-worker.min.js"></script>
```

### UMD CDN

```html
<script src="https://cdn.jsdelivr.net/npm/video-worker@2/dist/video-worker.min.js"></script>
```

### CommonJS

```javascript
const VideoWorker = require('video-worker');
```

## Use VideoWorker

```javascript
import VideoWorker from 'video-worker';

const videoObject = new VideoWorker('https://www.youtube.com/watch?v=ab0TSkLe-E0');

if (videoObject.isValid()) {
  videoObject.getVideo((video) => {
    const parent = video.parentNode;

    document.body.appendChild(video);

    if (parent?.parentNode) {
      parent.parentNode.removeChild(parent);
    }
  });
}
```

Supported URL examples:

- YouTube `https://www.youtube.com/watch?v=ab0TSkLe-E0`
- YouTube Shorts `https://www.youtube.com/shorts/ab0TSkLe-E0`
- Vimeo `https://vimeo.com/110138539`
- Self-hosted `mp4:./self-hosted-video.mp4,webm:./self-hosted-video.webm,ogv:./self-hosted-video.ogv`

For self-hosted videos, a single source is enough. Multiple formats are only needed for broader browser compatibility.

## Options

Name | Type | Default | Description
:--- | :--- | :------ | :----------
autoplay | `boolean` | `false` | Video autoplay.
loop | `boolean` | `false` | Loop playback.
showControls | `boolean` | `true` | Show player controls.
accessibilityHidden | `boolean` | `false` | Add accessibility attributes for videos used as decorative backgrounds.
mute | `boolean` | `false` | Mute sound.
volume | `number` | `100` | Volume level from `0` to `100`.
startTime | `number` | `0` | Start time in seconds. Applied on autoplay and loop restarts.
endTime | `number` | `0` | End time in seconds. Playback stops or loops once reached.

### Example <!-- omit in toc -->

```javascript
new VideoWorker('<URL_TO_YOUR_VIDEO>', {
  autoplay: true,
  loop: true,
  startTime: 10,
});
```

## Events

Name | Parameters | Description
:--- | :----- | :----------
ready | `event` | Fires once the video is ready to play.
volumechange | `event` | Fires when video volume changes.
timeupdate | `event` | Fires when playback time changes.
started | `event` | Fires once, when playback starts for the first time.
play | `event` | Fires when playback starts.
pause | `event` | Fires when playback pauses.
ended | `event` | Fires when playback ends.
error | `error` | Fires when the provider reports an error.

### Example <!-- omit in toc -->

```javascript
videoObject.on('ready', (event) => {
  console.log('video ready', event);
});
```

## Methods

Name | Result | Description
:--- | :----- | :----------
isValid | `boolean` | Check if the video URL was recognized by a provider.
play | `void` | Play the video.
pause | `void` | Pause the video.
mute | `void` | Mute audio.
unmute | `void` | Unmute audio.
getMuted | `boolean \| null` | Get mute state. `videoObject.getMuted((muted) => { ... })`
setVolume | `void` | Set volume level from `0` to `100`. `videoObject.setVolume(40);`
getVolume | `number \| false` | Get volume level. `videoObject.getVolume((volume) => { ... })`
setCurrentTime | `void` | Set current time in seconds. `videoObject.setCurrentTime(40);`
getCurrentTime | `number` | Get current time in seconds. `videoObject.getCurrentTime((currentTime) => { ... })`
getImageURL | `string` | Retrieve YouTube or Vimeo preview image URL. `videoObject.getImageURL((url) => { ... })`
getVideo | `HTMLElement \| HTMLIFrameElement \| HTMLVideoElement` | Retrieve the iframe or video DOM element. `videoObject.getVideo((video) => { ... })`
destroy | `void` | Dispose internal DOM, timers, and player references when the instance is no longer needed.

### Example <!-- omit in toc -->

```javascript
videoObject.mute();
```

## Custom Providers

Video Worker supports YouTube, Vimeo, and self-hosted videos out of the box. You can register custom providers without changing the factory API.

```javascript
VideoWorker.providers.MyVideoProvider = class MyVideoProvider extends VideoWorker.BaseClass {
  type = 'my-video-provider';

  static parseURL(url) {
    return url.startsWith('custom:') ? url.slice('custom:'.length) : false;
  }
};
```

Provider implementations live in [`src/providers`](https://github.com/nk-o/video-worker/tree/master/src/providers).

## For Developers

### Installation <!-- omit in toc -->

- Run `npm install`

### Development <!-- omit in toc -->

- `npm run dev` to build in watch mode and serve the demo on port `3002`

### Quality checks <!-- omit in toc -->

- `npm run typecheck` to validate TypeScript
- `npm run lint` to run Biome checks
- `npm run lint:fix` to apply safe Biome fixes
- `npm run format` to format files with Biome
- `npm run format:check` to verify formatting
- `npm run test:run` to run the test suite once
- `npm run test:coverage` to generate coverage output
- `npm run test:artifacts` to validate published build artifacts

### Build <!-- omit in toc -->

- `npm run build` to generate all bundles and declaration files
