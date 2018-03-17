// Deferred
// thanks http://stackoverflow.com/questions/18096715/implement-deferred-object-without-using-jquery
function Deferred() {
    this._done = [];
    this._fail = [];
}
Deferred.prototype = {
    execute(list, args) {
        let i = list.length;
        args = Array.prototype.slice.call(args);
        while (i--) {
            list[i].apply(null, args);
        }
    },
    resolve() {
        this.execute(this._done, arguments);
    },
    reject() {
        this.execute(this._fail, arguments);
    },
    done(callback) {
        this._done.push(callback);
    },
    fail(callback) {
        this._fail.push(callback);
    },
};

let ID = 0;
let YoutubeAPIadded = 0;
let VimeoAPIadded = 0;
let loadingYoutubePlayer = 0;
let loadingVimeoPlayer = 0;
const loadingYoutubeDefer = new Deferred();
const loadingVimeoDefer = new Deferred();

export default class VideoWorker {
    constructor(url, options) {
        const self = this;

        self.url = url;

        self.options_default = {
            autoplay: false,
            loop: false,
            mute: false,
            volume: 100,
            showContols: true,

            // start / end video time in seconds
            startTime: 0,
            endTime: 0,
        };

        self.options = self.extend({}, self.options_default, options);

        // check URL
        self.videoID = self.parseURL(url);

        // init
        if (self.videoID) {
            self.ID = ID++;
            self.loadAPI();
            self.init();
        }
    }

    // Extend like jQuery.extend
    extend(out) {
        out = out || {};
        Object.keys(arguments).forEach((i) => {
            if (!arguments[i]) {
                return;
            }
            Object.keys(arguments[i]).forEach((key) => {
                out[key] = arguments[i][key];
            });
        });
        return out;
    }

    parseURL(url) {
        // parse youtube ID
        function getYoutubeID(ytUrl) {
            // eslint-disable-next-line no-useless-escape
            const regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
            const match = ytUrl.match(regExp);
            return match && match[1].length === 11 ? match[1] : false;
        }

        // parse vimeo ID
        function getVimeoID(vmUrl) {
            // eslint-disable-next-line no-useless-escape
            const regExp = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
            const match = vmUrl.match(regExp);
            return match && match[3] ? match[3] : false;
        }

        // parse local string
        function getLocalVideos(locUrl) {
            // eslint-disable-next-line no-useless-escape
            const videoFormats = locUrl.split(/,(?=mp4\:|webm\:|ogv\:|ogg\:)/);
            const result = {};
            let ready = 0;
            videoFormats.forEach((val) => {
                // eslint-disable-next-line no-useless-escape
                const match = val.match(/^(mp4|webm|ogv|ogg)\:(.*)/);
                if (match && match[1] && match[2]) {
                    // eslint-disable-next-line prefer-destructuring
                    result[match[1] === 'ogv' ? 'ogg' : match[1]] = match[2];
                    ready = 1;
                }
            });
            return ready ? result : false;
        }

        const Youtube = getYoutubeID(url);
        const Vimeo = getVimeoID(url);
        const Local = getLocalVideos(url);

        if (Youtube) {
            this.type = 'youtube';
            return Youtube;
        } else if (Vimeo) {
            this.type = 'vimeo';
            return Vimeo;
        } else if (Local) {
            this.type = 'local';
            return Local;
        }

        return false;
    }

    isValid() {
        return !!this.videoID;
    }

    // events
    on(name, callback) {
        this.userEventsList = this.userEventsList || [];

        // add new callback in events list
        (this.userEventsList[name] || (this.userEventsList[name] = [])).push(callback);
    }
    off(name, callback) {
        if (!this.userEventsList || !this.userEventsList[name]) {
            return;
        }

        if (!callback) {
            delete this.userEventsList[name];
        } else {
            this.userEventsList[name].forEach((val, key) => {
                if (val === callback) {
                    this.userEventsList[name][key] = false;
                }
            });
        }
    }
    fire(name) {
        const args = [].slice.call(arguments, 1);
        if (this.userEventsList && typeof this.userEventsList[name] !== 'undefined') {
            this.userEventsList[name].forEach((val) => {
                // call with all arguments
                if (val) {
                    val.apply(this, args);
                }
            });
        }
    }

    play(start) {
        const self = this;
        if (!self.player) {
            return;
        }

        if (self.type === 'youtube' && self.player.playVideo) {
            if (typeof start !== 'undefined') {
                self.player.seekTo(start || 0);
            }
            if (YT.PlayerState.PLAYING !== self.player.getPlayerState()) {
                self.player.playVideo();
            }
        }

        if (self.type === 'vimeo') {
            if (typeof start !== 'undefined') {
                self.player.setCurrentTime(start);
            }
            self.player.getPaused().then((paused) => {
                if (paused) {
                    self.player.play();
                }
            });
        }

        if (self.type === 'local') {
            if (typeof start !== 'undefined') {
                self.player.currentTime = start;
            }
            if (self.player.paused) {
                self.player.play();
            }
        }
    }

    pause() {
        const self = this;
        if (!self.player) {
            return;
        }

        if (self.type === 'youtube' && self.player.pauseVideo) {
            if (YT.PlayerState.PLAYING === self.player.getPlayerState()) {
                self.player.pauseVideo();
            }
        }

        if (self.type === 'vimeo') {
            self.player.getPaused().then((paused) => {
                if (!paused) {
                    self.player.pause();
                }
            });
        }

        if (self.type === 'local') {
            if (!self.player.paused) {
                self.player.pause();
            }
        }
    }

    mute() {
        const self = this;
        if (!self.player) {
            return;
        }

        if (self.type === 'youtube' && self.player.mute) {
            self.player.mute();
        }

        if (self.type === 'vimeo' && self.player.setVolume) {
            self.player.setVolume(0);
        }

        if (self.type === 'local') {
            self.$video.muted = true;
        }
    }

    unmute() {
        const self = this;
        if (!self.player) {
            return;
        }

        if (self.type === 'youtube' && self.player.mute) {
            self.player.unMute();
        }

        if (self.type === 'vimeo' && self.player.setVolume) {
            self.player.setVolume(self.options.volume);
        }

        if (self.type === 'local') {
            self.$video.muted = false;
        }
    }

    setVolume(volume = false) {
        const self = this;
        if (!self.player || !volume) {
            return;
        }

        if (self.type === 'youtube' && self.player.setVolume) {
            self.player.setVolume(volume);
        }

        if (self.type === 'vimeo' && self.player.setVolume) {
            self.player.setVolume(volume);
        }

        if (self.type === 'local') {
            self.$video.volume = volume / 100;
        }
    }

    getVolume(callback) {
        const self = this;
        if (!self.player) {
            callback(false);
            return;
        }

        if (self.type === 'youtube' && self.player.getVolume) {
            callback(self.player.getVolume());
        }

        if (self.type === 'vimeo' && self.player.getVolume) {
            self.player.getVolume().then((volume) => {
                callback(volume);
            });
        }

        if (self.type === 'local') {
            callback(self.$video.volume * 100);
        }
    }

    getMuted(callback) {
        const self = this;
        if (!self.player) {
            callback(null);
            return;
        }

        if (self.type === 'youtube' && self.player.isMuted) {
            callback(self.player.isMuted());
        }

        if (self.type === 'vimeo' && self.player.getVolume) {
            self.player.getVolume().then((volume) => {
                callback(!!volume);
            });
        }

        if (self.type === 'local') {
            callback(self.$video.muted);
        }
    }

    getImageURL(callback) {
        const self = this;

        if (self.videoImage) {
            callback(self.videoImage);
            return;
        }

        if (self.type === 'youtube') {
            const availableSizes = [
                'maxresdefault',
                'sddefault',
                'hqdefault',
                '0',
            ];
            let step = 0;

            const tempImg = new Image();
            tempImg.onload = function () {
                // if no thumbnail, youtube add their own image with width = 120px
                if ((this.naturalWidth || this.width) !== 120 || step === availableSizes.length - 1) {
                    // ok
                    self.videoImage = `https://img.youtube.com/vi/${self.videoID}/${availableSizes[step]}.jpg`;
                    callback(self.videoImage);
                } else {
                    // try another size
                    step++;
                    this.src = `https://img.youtube.com/vi/${self.videoID}/${availableSizes[step]}.jpg`;
                }
            };
            tempImg.src = `https://img.youtube.com/vi/${self.videoID}/${availableSizes[step]}.jpg`;
        }

        if (self.type === 'vimeo') {
            let request = new XMLHttpRequest();
            request.open('GET', `https://vimeo.com/api/v2/video/${self.videoID}.json`, true);
            request.onreadystatechange = function () {
                if (this.readyState === 4) {
                    if (this.status >= 200 && this.status < 400) {
                        // Success!
                        const response = JSON.parse(this.responseText);
                        self.videoImage = response[0].thumbnail_large;
                        callback(self.videoImage);
                    } else {
                        // Error :(
                    }
                }
            };
            request.send();
            request = null;
        }
    }

    // fallback to the old version.
    getIframe(callback) {
        this.getVideo(callback);
    }

    getVideo(callback) {
        const self = this;

        // return generated video block
        if (self.$video) {
            callback(self.$video);
            return;
        }

        // generate new video block
        self.onAPIready(() => {
            let hiddenDiv;
            if (!self.$video) {
                hiddenDiv = document.createElement('div');
                hiddenDiv.style.display = 'none';
            }

            // Youtube
            if (self.type === 'youtube') {
                self.playerOptions = {};
                self.playerOptions.videoId = self.videoID;
                self.playerOptions.playerVars = {
                    autohide: 1,
                    rel: 0,
                    autoplay: 0,
                    // autoplay enable on mobile devices
                    playsinline: 1,
                };

                // hide controls
                if (!self.options.showContols) {
                    self.playerOptions.playerVars.iv_load_policy = 3;
                    self.playerOptions.playerVars.modestbranding = 1;
                    self.playerOptions.playerVars.controls = 0;
                    self.playerOptions.playerVars.showinfo = 0;
                    self.playerOptions.playerVars.disablekb = 1;
                }

                // events
                let ytStarted;
                let ytProgressInterval;
                self.playerOptions.events = {
                    onReady(e) {
                        // mute
                        if (self.options.mute) {
                            e.target.mute();
                        } else if (self.options.volume) {
                            e.target.setVolume(self.options.volume);
                        }

                        // autoplay
                        if (self.options.autoplay) {
                            self.play(self.options.startTime);
                        }
                        self.fire('ready', e);

                        // volumechange
                        setInterval(() => {
                            self.getVolume((volume) => {
                                if (self.options.volume !== volume) {
                                    self.options.volume = volume;
                                    self.fire('volumechange', e);
                                }
                            });
                        }, 150);
                    },
                    onStateChange(e) {
                        // loop
                        if (self.options.loop && e.data === YT.PlayerState.ENDED) {
                            self.play(self.options.startTime);
                        }
                        if (!ytStarted && e.data === YT.PlayerState.PLAYING) {
                            ytStarted = 1;
                            self.fire('started', e);
                        }
                        if (e.data === YT.PlayerState.PLAYING) {
                            self.fire('play', e);
                        }
                        if (e.data === YT.PlayerState.PAUSED) {
                            self.fire('pause', e);
                        }
                        if (e.data === YT.PlayerState.ENDED) {
                            self.fire('ended', e);
                        }

                        // progress check
                        if (e.data === YT.PlayerState.PLAYING) {
                            ytProgressInterval = setInterval(() => {
                                self.fire('timeupdate', e);

                                // check for end of video and play again or stop
                                if (self.options.endTime && self.player.getCurrentTime() >= self.options.endTime) {
                                    if (self.options.loop) {
                                        self.play(self.options.startTime);
                                    } else {
                                        self.pause();
                                    }
                                }
                            }, 150);
                        } else {
                            clearInterval(ytProgressInterval);
                        }
                    },
                };

                const firstInit = !self.$video;
                if (firstInit) {
                    const div = document.createElement('div');
                    div.setAttribute('id', self.playerID);
                    hiddenDiv.appendChild(div);
                    document.body.appendChild(hiddenDiv);
                }
                self.player = self.player || new window.YT.Player(self.playerID, self.playerOptions);
                if (firstInit) {
                    self.$video = document.getElementById(self.playerID);

                    // get video width and height
                    self.videoWidth = parseInt(self.$video.getAttribute('width'), 10) || 1280;
                    self.videoHeight = parseInt(self.$video.getAttribute('height'), 10) || 720;
                }
            }

            // Vimeo
            if (self.type === 'vimeo') {
                self.playerOptions = '';

                self.playerOptions += `player_id=${self.playerID}`;
                self.playerOptions += '&autopause=0';
                self.playerOptions += '&transparent=0';

                // hide controls
                if (!self.options.showContols) {
                    self.playerOptions += '&badge=0&byline=0&portrait=0&title=0';
                }

                // autoplay
                self.playerOptions += `&autoplay=${self.options.autoplay ? '1' : '0'}`;

                // loop
                self.playerOptions += `&loop=${self.options.loop ? 1 : 0}`;

                if (!self.$video) {
                    self.$video = document.createElement('iframe');
                    self.$video.setAttribute('id', self.playerID);
                    self.$video.setAttribute('src', `https://player.vimeo.com/video/${self.videoID}?${self.playerOptions}`);
                    self.$video.setAttribute('frameborder', '0');
                    hiddenDiv.appendChild(self.$video);
                    document.body.appendChild(hiddenDiv);
                }

                self.player = self.player || new Vimeo.Player(self.$video);

                // get video width and height
                self.player.getVideoWidth().then((width) => {
                    self.videoWidth = width || 1280;
                });
                self.player.getVideoHeight().then((height) => {
                    self.videoHeight = height || 720;
                });

                // set current time for autoplay
                if (self.options.startTime && self.options.autoplay) {
                    self.player.setCurrentTime(self.options.startTime);
                }

                // mute
                if (self.options.mute) {
                    self.player.setVolume(0);
                } else if (self.options.volume) {
                    self.player.setVolume(self.options.volume);
                }

                let vmStarted;
                self.player.on('timeupdate', (e) => {
                    if (!vmStarted) {
                        self.fire('started', e);
                        vmStarted = 1;
                    }

                    self.fire('timeupdate', e);

                    // check for end of video and play again or stop
                    if (self.options.endTime) {
                        if (self.options.endTime && e.seconds >= self.options.endTime) {
                            if (self.options.loop) {
                                self.play(self.options.startTime);
                            } else {
                                self.pause();
                            }
                        }
                    }
                });
                self.player.on('play', (e) => {
                    self.fire('play', e);

                    // check for the start time and start with it
                    if (self.options.startTime && e.seconds === 0) {
                        self.play(self.options.startTime);
                    }
                });
                self.player.on('pause', (e) => {
                    self.fire('pause', e);
                });
                self.player.on('ended', (e) => {
                    self.fire('ended', e);
                });
                self.player.on('loaded', (e) => {
                    self.fire('ready', e);
                });
                self.player.on('volumechange', (e) => {
                    self.fire('volumechange', e);
                });
            }

            // Local
            function addSourceToLocal(element, src, type) {
                const source = document.createElement('source');
                source.src = src;
                source.type = type;
                element.appendChild(source);
            }
            if (self.type === 'local') {
                if (!self.$video) {
                    self.$video = document.createElement('video');

                    // mute
                    if (self.options.mute) {
                        self.$video.muted = true;
                    } else if (self.$video.volume) {
                        self.$video.volume = self.options.volume / 100;
                    }

                    // loop
                    if (self.options.loop) {
                        self.$video.loop = true;
                    }

                    // autoplay enable on mobile devices
                    self.$video.setAttribute('playsinline', '');
                    self.$video.setAttribute('webkit-playsinline', '');

                    self.$video.setAttribute('id', self.playerID);
                    hiddenDiv.appendChild(self.$video);
                    document.body.appendChild(hiddenDiv);

                    Object.keys(self.videoID).forEach((key) => {
                        addSourceToLocal(self.$video, self.videoID[key], `video/${key}`);
                    });
                }

                self.player = self.player || self.$video;

                let locStarted;
                self.player.addEventListener('playing', (e) => {
                    if (!locStarted) {
                        self.fire('started', e);
                    }
                    locStarted = 1;
                });
                self.player.addEventListener('timeupdate', function (e) {
                    self.fire('timeupdate', e);

                    // check for end of video and play again or stop
                    if (self.options.endTime) {
                        if (self.options.endTime && this.currentTime >= self.options.endTime) {
                            if (self.options.loop) {
                                self.play(self.options.startTime);
                            } else {
                                self.pause();
                            }
                        }
                    }
                });
                self.player.addEventListener('play', (e) => {
                    self.fire('play', e);
                });
                self.player.addEventListener('pause', (e) => {
                    self.fire('pause', e);
                });
                self.player.addEventListener('ended', (e) => {
                    self.fire('ended', e);
                });
                self.player.addEventListener('loadedmetadata', function () {
                    // get video width and height
                    self.videoWidth = this.videoWidth || 1280;
                    self.videoHeight = this.videoHeight || 720;

                    self.fire('ready');

                    // autoplay
                    if (self.options.autoplay) {
                        self.play(self.options.startTime);
                    }
                });
                self.player.addEventListener('volumechange', (e) => {
                    self.getVolume((volume) => {
                        self.options.volume = volume;
                    });
                    self.fire('volumechange', e);
                });
            }

            callback(self.$video);
        });
    }

    init() {
        const self = this;

        self.playerID = `VideoWorker-${self.ID}`;
    }

    loadAPI() {
        const self = this;

        if (YoutubeAPIadded && VimeoAPIadded) {
            return;
        }

        let src = '';

        // load Youtube API
        if (self.type === 'youtube' && !YoutubeAPIadded) {
            YoutubeAPIadded = 1;
            src = 'https://www.youtube.com/iframe_api';
        }

        // load Vimeo API
        if (self.type === 'vimeo' && !VimeoAPIadded) {
            VimeoAPIadded = 1;
            src = 'https://player.vimeo.com/api/player.js';
        }

        if (!src) {
            return;
        }

        // add script in head section
        let tag = document.createElement('script');
        let head = document.getElementsByTagName('head')[0];
        tag.src = src;

        head.appendChild(tag);

        head = null;
        tag = null;
    }

    onAPIready(callback) {
        const self = this;

        // Youtube
        if (self.type === 'youtube') {
            // Listen for global YT player callback
            if ((typeof YT === 'undefined' || YT.loaded === 0) && !loadingYoutubePlayer) {
                // Prevents Ready event from being called twice
                loadingYoutubePlayer = 1;

                // Creates deferred so, other players know when to wait.
                window.onYouTubeIframeAPIReady = function () {
                    window.onYouTubeIframeAPIReady = null;
                    loadingYoutubeDefer.resolve('done');
                    callback();
                };
            } else if (typeof YT === 'object' && YT.loaded === 1) {
                callback();
            } else {
                loadingYoutubeDefer.done(() => {
                    callback();
                });
            }
        }

        // Vimeo
        if (self.type === 'vimeo') {
            if (typeof Vimeo === 'undefined' && !loadingVimeoPlayer) {
                loadingVimeoPlayer = 1;
                const vimeoInterval = setInterval(() => {
                    if (typeof Vimeo !== 'undefined') {
                        clearInterval(vimeoInterval);
                        loadingVimeoDefer.resolve('done');
                        callback();
                    }
                }, 20);
            } else if (typeof Vimeo !== 'undefined') {
                callback();
            } else {
                loadingVimeoDefer.done(() => {
                    callback();
                });
            }
        }

        // Local
        if (self.type === 'local') {
            callback();
        }
    }
}
