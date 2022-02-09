# Video Worker

API wrapper for Youtube, Vimeo and Local videos

## Getting Started

### ESM

We provide a version of VideoWorker built as ESM (video-worker.esm.js and video-worker.esm.min.js) which allows you to use VideoWorker as a module in your browser, if your [targeted browsers support it](https://caniuse.com/es6-module).

```html
<script type="module">
  import VideoWorker from "video-worker.esm.min.js";

  const videoObject = new VideoWorker("https://www.youtube.com/watch?v=ab0TSkLe-E0");
</script>
```

### UMD

VideoWorker may be also used in a traditional way by including script in HTML and using library by accessing `window.VideoWorker`.

```html
<script src="video-worker.min.js"></script>

<script>
  const videoObject = new VideoWorker("https://www.youtube.com/watch?v=ab0TSkLe-E0");
</script>
```

### Webpack

Install VideoWorker as a Node.js module using npm

```
npm install video-worker
```

Import VideoWorker by adding this line to your app's entry point (usually `index.js` or `app.js`):

```javascript
import VideoWorker from 'video-worker';

const videoObject = new VideoWorker('https://www.youtube.com/watch?v=ab0TSkLe-E0');
```

## Simple usage example

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
* Local Hosted `mp4:./local-video.mp4,webm:./local-video.webm,ogv:./local-video.ogv`

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

### Example

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

### Example

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
getImageURL | string | Retrieves Youtube/Vimeo video poster image URL. `videoObject.getImageURL((url) => { ... })`
getVideo | dom | Retrieves iframe/video dom element. `videoObject.getVideo((video) => { ... })`

### Example

```javascript
videoObject.mute();
```

## For Developers

### Installation

* Run `npm install` in the command line. Or if you need to update some dependencies, run `npm update`

### Building

* `npm run build` to run build

### Linting

* `npm run js-lint` to show eslint errors
* `npm run js-lint-fix` to automatically fix some of the eslint errors
