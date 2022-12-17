# Changelog

## [2.1.4] - Dec 17, 2022

- fixed possibility to set volume 0
- fixed self-hosted video mute on startup
- fixed Vimeo set startup volume
- fixed Vimeo update volume option when change volume in the player UI
- removed `extend` method from the VideoWorker class
- removed fallback for `showContols` option, use `showControls` instead
- removed unused player options from Vimeo

## [2.1.2] - Dec 15, 2022

- added Vimeo high quality thumbnail support
- added support for Youtube Shorts URLs
- fixed volume value for Vimeo player (used range from 0 to 1)
- fixed Vimeo unmute when initial volume is 0

## [2.0.0] - Feb 9, 2022

- added ESM, CJS, and UMD builds
- dropped IE support, only modern browsers supported
- fixed usage of deprecated Vimeo API to get video thumbnail, use oEmbed API instead
- changed gulp and webpack to rollup (less dependencies)
- removed `global` dependency
