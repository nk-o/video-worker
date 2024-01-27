# Video Worker <!-- omit in toc -->

![video-worker.min.js](https://img.badgesize.io/nk-o/video-worker/master/dist/video-worker.min.js?compression=gzip)

API wrapper for Youtube, Vimeo and Self-Hosted videos

## Table of Contents <!-- omit in toc -->

- [Import VideoWorker](#import-videoworker)
  - [ESM](#esm)
  - [ESM CDN](#esm-cdn)
  - [UMD](#umd)
  - [UMD CDN](#umd-cdn)
  - [CJS (Bundlers like Webpack)](#cjs-bundlers-like-webpack)
- [Use VideoWorker](#use-videoworker)
- [Options](#options)
- [Events](#events)
- [Methods](#methods)
- [Video Providers](#video-providers)
- [For Developers](#for-developers)

## Import VideoWorker

Use one of the following examples to import script.

### ESM

We provide a version of VideoWorker built as ESM (video-worker.esm.js and video-worker.esm.min.js) which allows you to use VideoWorker as a module in your browser, if your [targeted browsers support it](https://caniuse.com/es6-module).

```html
<script type="module">
  import VideoWorker from "video-worker.esm.min.js";
</script>
```

### ESM CDN

```html
<script type="module">
  import VideoWorker from "https://cdn.jsdelivr.net/npm/video-worker@2/+esm";
</script>
```

### UMD

VideoWorker may be also used in a traditional way by including script in HTML and using library by accessing `window.VideoWorker`.

```html
<script src="video-worker.min.js"></script>
```


### UMD CDN

```html
<script src="https://cdn.jsdelivr.net/npm/video-worker@2/dist/video-worker.min.js"></script>
```

### CJS (Bundlers like Webpack)

Install VideoWorker as a Node.js module using npm

```
npm install video-worker
```

Import VideoWorker by adding this line to your app's entry point (usually `index.js` or `app.js`):

```javascript
import VideoWorker from 'video-worker';
```

## Use VideoWorker

```javascript
import VideoWorker from 'video-worker';

const videoObject = new VideoWorker('https://www.youtube.com/watch?v=ab0TSkLe-E0');

if (videoObject.isValid()) {
  // retrieve iframe/video dom element.
  videoObject.getVideo((video) => {
    const $parent = video.parentNode;

    // insert video in the body.
    document.body.appendChild(video);

    // remove temporary parent video element (created by VideoWorker).
    $parent.parentNode.removeChild($parent);
  });
}
```

Video URLs examples:

* YouTube `https://www.youtube.com/watch?v=ab0TSkLe-E0`
* Vimeo `https://vimeo.com/110138539`
* Self Hosted `mp4:./self-hosted-video.mp4,webm:./self-hosted-video.webm,ogv:./self-hosted-video.ogv`

Note: for self-hosted videos required only 1 video type, not necessary use all mp4, webm and ogv. This need only for maximum compatibility with all browsers.

## Options

Name | Type | Default | Description
:--- | :--- | :------ | :----------
autoplay | bool | `false` | Video autoplay.
loop | bool | `false` | Video playing loop.
showControls | bool | `true` | Video controls.
accessibilityHidden | bool | `false` | Add accessibility attributes for videos used on backgrounds.
mute | bool | `false` | Mute sound.
volume | int | `100` | Volume level from 0 to 100.
startTime | float | `0` | Start time in seconds when video will be started (this value will be applied also after loop).
endTime | float | `0` | End time in seconds when video will be ended.

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
ready | `event` | Fires only once, when the video is ready to play.
volumechange | `event` | Fires when video volume changed.
timeupdate | `event` | Fires when video current time changed.
started | `event` | Fires only once, when the video is started playing.
play | `event` | Fires on video play start.
pause | `event` | Fires on video paused.
ended | `event` | Fires on video ended.
error | `error` | Fires on video error

### Example <!-- omit in toc -->

```javascript
videoObject.on('ready', (event) => {
  console.log('video ready', event);
});
```

## Methods

Name | Result | Description
:--- | :----- | :----------
isValid | bool | Check if the video is successfully determined and ready to use.
play | - | Play video.
pause | - | Pause video.
mute | - | Mute sound.
unmute | - | Unmute sound.
getMuted | int | Get mute state. `videoObject.getMuted((muted) => { ... })`
setVolume | - | Set volume level (takes integer value from 0 to 100). `videoObject.setVolume(40);`
getVolume | int | Get volume level. `videoObject.getVolume((volume) => { ... })`
setCurrentTime | - | Set current time in seconds. `videoObject.setCurrentTime(40);`
getCurrentTime | int | Get current time in seconds. `videoObject.getCurrentTime((currentTime) => { ... })`
getImageURL | string | Retrieves Youtube/Vimeo video poster image URL. `videoObject.getImageURL((url) => { ... })`
getVideo | dom | Retrieves iframe/video dom element. `videoObject.getVideo((video) => { ... })`

### Example <!-- omit in toc -->

```javascript
videoObject.mute();
```

## Video Providers

By default VideoWorker provides support for Youtube, Vimeo and Self-Hosted videos. There is a possibility to extend providers list and add support for different platform.

Example:

```javascript
VideoWorker.providers.MyVideoProvider = class MyVideoProvider extends VideoWorker.BaseClass {
  type = 'my-video-provider';
  ...
}
```

All available methods for custom provider class you can find in existing providers - <https://github.com/nk-o/video-worker/tree/master/src/providers>

## For Developers

### Installation <!-- omit in toc -->

* Run `npm install` in the command line. Or if you need to update some dependencies, run `npm update`

### Building <!-- omit in toc -->

* `npm run build` to run build

### Linting <!-- omit in toc -->

* `npm run js-lint` to show eslint errors
* `npm run js-lint-fix` to automatically fix some of the eslint errors
