/**
    @module audio
**/
game.module(
    'engine.audio'
)
.body(function() {

/**
    Audio manager. Instance automatically created at `game.audio`
    @class Audio
**/
game.createClass('Audio', {
    /**
        Current supported audio formats.
        @property {Array} formats
    **/
    formats: [],
    /**
        Current music.
        @property {Music} music
    **/
    music: null,
    /**
        Is audio muted.
        @property {Boolean} muted
        @default false
    **/
    muted: false,
    /**
        Currently playing sounds.
        @property {Array} sounds
    **/
    sounds: [],
    /**
        @property {AudioContext} _context
        @private
    **/
    _context: null,
    /**
        @property {GainNode} _mainGain
        @private
    **/
    _mainGain: null,
    /**
        @property {GainNode} _musicGain
        @private
    **/
    _musicGain: null,
    /**
        @property {Music} _pauseMusic
        @private
    **/
    _pauseMusic: null,
    /**
        @property {Array} _pauseSounds
        @private
    **/
    _pauseSounds: [],
    /**
        @property {GainNode} _soundGain
        @private
    **/
    _soundGain: null,

    staticInit: function() {
        if (!game.Audio.enabled) return;
        
        game._normalizeVendorAttribute(window, 'AudioContext');

        var audio = new Audio();
        for (var i = 0; i < game.Audio.formats.length; i++) {
            if (audio.canPlayType(game.Audio.formats[i].type)) {
                this.formats.push(game.Audio.formats[i].ext);
            }
        }

        if (!this.formats.length) {
            game.Audio.enabled = false;
            return;
        }

        if (!window.AudioContext) return;

        this._context = new AudioContext();

        this._mainGain = this._context.createGain();
        this._mainGain.connect(this._context.destination);

        this._musicGain = this._context.createGain();
        this._musicGain.gain.setValueAtTime(game.Audio.musicVolume, this._context.currentTime);
        this._musicGain.connect(this._mainGain);

        this._soundGain = this._context.createGain();
        this._soundGain.gain.setValueAtTime(game.Audio.soundVolume, this._context.currentTime);
        this._soundGain.connect(this._mainGain);
    },

    /**
        Mute all audio.
        @method mute
    **/
    mute: function() {
        if (!this._mainGain) return;
        this._mainGain.gain.setValueAtTime(0, this._context.currentTime);
        this.muted = true;
    },

    /**
        @method playMusic
        @param {String} name
        @return {Music}
    **/
    playMusic: function(name) {
        var music = new game.Music(name).play();
        return music;
    },

    /**
        @method playSound
        @param {String} name
        @param {Number} [volume]
        @param {Number} [rate]
        @return {Sound}
    **/
    playSound: function(name, volume, rate) {
        var sound = new game.Sound(name);
        sound.volume = volume || sound.volume;
        sound.rate = rate || sound._rate;
        sound.play();
        return sound;
    },

    /**
        Stop all sounds.
        @method stopAll
    **/
    stopAll: function() {
        this.stopMusic();
        for (var i = 0; i < this.sounds.length; i++) {
            this.sounds[i].stop();
        }
    },

    /**
        Stop current music.
        @method stopMusic
    **/
    stopMusic: function() {
        if (this.music) this.music.stop();
        this.music = null;
    },

    /**
        Toggle mute/unmute all audio.
        @method toggle
    **/
    toggle: function() {
        if (this.muted) this.unmute();
        else this.mute();
        return this.muted;
    },

    /**
        Unmute all audio.
        @method unmute
    **/
    unmute: function() {
        if (!this._mainGain) return;
        this._mainGain.gain.setValueAtTime(1, this._context.currentTime);
        this.muted = false;
    },

    /**
        @method _decode
        @param {XMLHttpRequest} request
        @param {String} path
        @param {Function} callback
        @private
    **/
    _decode: function(request, path, callback) {
        this._context.decodeAudioData(
            request.response,
            this._loaded.bind(this, path, callback),
            this._error.bind(this, path, callback)
        );
    },

    /**
        @method _error
        @param {String} path
        @param {Function} callback
        @private
    **/
    _error: function(path, callback) {
        callback('Error loading audio ' + path);
    },
    
    /**
        @method _load
        @param {String} path
        @param {Function} callback
        @private
    **/
    _load: function(path, callback) {
        if (!game.Audio.enabled) {
            callback();
            return;
        }
        var ext = path.split('?').shift().split('.').pop();
        if (this.formats.indexOf(ext) === -1) ext = this.formats[0];
        
        var realPath = path.replace(/[^\.]+$/, ext + game._nocache);

        if (!window.AudioContext) {
            var audio = new Audio();
            audio.src = realPath;
            this._loaded(path, callback, audio);
        }
        else {
            var request = new XMLHttpRequest();
            request.open('GET', realPath, true);
            request.responseType = 'arraybuffer';
            request.onload = this._decode.bind(this, request, path, callback);
            request.send();
        }
    },

    /**
        @method _loaded
        @param {String} path
        @param {Function} callback
        @param {AudioBuffer} buffer
        @private
    **/
    _loaded: function(path, callback, buffer) {
        var id = game._getId(path);
        game.Audio.cache[id] = buffer;
        callback();
    },

    /**
        @method _systemPause
        @private
    **/
    _systemPause: function() {
        if (this.music && this.music.playing) {
            this.music.pause();
            this._pauseMusic = this.music;
        }
        for (var i = 0; i < this.sounds.length; i++) {
            if (this.sounds[i].playing) {
                this.sounds[i].pause();
                this._pauseSounds.push(this.sounds[i]);
            }
        }
    },

    /**
        @method _systemResume
        @private
    **/
    _systemResume: function() {
        if (this._pauseMusic) this._pauseMusic.resume();
        for (var i = 0; i < this._pauseSounds.length; i++) {
            this._pauseSounds[i].resume();
        }
        this._pauseMusic = null;
        this._pauseSounds.length = 0;
    }
});

game.addAttributes('Audio', {
    /**
        Cache for audio buffers.
        @attribute {Object} cache
    **/
    cache: {},

    /**
        Clear all audio buffers from cache.
        @method clearCache
        @static
    **/
    clearCache: function() {
        for (var i in this.cache) {
            delete this.cache[i];
        }
    },

    /**
        Is audio enabled.
        @attribute {Boolean} enabled
        @default true
    **/
    enabled: true,

    /**
        List of supported audio formats.
        @attribute {Array} formats
    **/
    formats: [
        { ext: 'ogg', type: 'audio/ogg; codecs="vorbis"' },
        { ext: 'm4a', type: 'audio/mp4; codecs="mp4a.40.5"' },
        { ext: 'wav', type: 'audio/wav' }
    ],

    /**
        Length to trim looped audio from end (seconds).
        @attribute {Number} loopEnd
        @default 0
    **/
    loopEnd: 0,

    /**
        Length to trim looped audio from start (seconds).
        @attribute {Number} loopStart
        @default 0
    **/
    loopStart: 0,

    /**
        Initial music volume (0-1).
        @attribute {Number} musicVolume
        @default 1
    **/
    musicVolume: 1,

    /**
        Initial sound volume (0-1).
        @attribute {Number} soundVolume
        @default 1
    **/
    soundVolume: 1,

    /**
        Stop all audio, when changing scene.
        @attribute {Boolean} stopOnSceneChange
        @default true
    **/
    stopOnSceneChange: true
});

/**
    @class Sound
    @constructor
    @param {String} id Audio asset id
**/
game.createClass('Sound', {
    /**
        Is sound looping.
        @property {Boolean} loop
        @default false
    **/
    loop: false,
    /**
        Is sound muted.
        @property {Boolean} muted
        @default false
    **/
    muted: false,
    /**
        Function to call, when sound is completed.
        @property {Function} onComplete
    **/
    onComplete: null,
    /**
        Is sound paused.
        @property {Boolean} paused
        @default false
    **/
    paused: false,
    /**
        Is sound playing.
        @property {Boolean} playing
        @default false
    **/
    playing: false,
    /**
        @property {AudioBuffer} _buffer
        @private
    **/
    _buffer: null,
    /**
        @property {AudioContext} _context
        @private
    **/
    _context: null,
    /**
        @property {GainNode} _gainNode
        @private
    **/
    _gainNode: null,
    /**
        @property {Number} _rate
        @private
    **/
    _rate: 1,
    /**
        @property {AudioBufferSourceNode} _source
        @private
    **/
    _source: null,
    /**
        @property {Number} _volume
        @private
    **/
    _volume: 1,

    staticInit: function(id) {
        if (!game.Audio.enabled) return true;

        this._buffer = game.Audio.cache[id];
        if (!this._buffer) throw 'Audio ' + id + ' not found';

        if (!window.AudioContext) return;

        this._context = game.audio.context;
        this._gainNode = this._context.createGain();
    },

    init: function() {
        if (this._gainNode) this._gainNode.connect(game.audio._soundGain);
        this.volume = game.Audio.soundVolume;
    },

    /**
        @method fadeIn
        @param {Number} time Time in milliseconds
    **/
    fadeIn: function(time) {
        this._fade(time, this.volume);
    },

    /**
        @method fadeOut
        @param {Number} time Time in milliseconds
    **/
    fadeOut: function(time) {
        this._fade(time, 0);
    },

    /**
        @method mute
    **/
    mute: function() {
        if (!this._gainNode) this._source.volume = 0;
        else this._gainNode.gain.setValueAtTime(0, this._context.currentTime);
        this.muted = true;
    },

    /**
        @method pause
    **/
    pause: function() {
        if (!this._source) return;
        if (this.paused) return;
        if (!this.playing) return;

        this.stop();
        this.paused = true;
        this._source.pauseTime = (this._context.currentTime - this._source.startTime) % this._buffer.duration;
    },

    /**
        @method play
        @param {Number} [when] When to start playback in seconds, 0 is now
        @param {Number} [offset] Offset of playback in seconds
        @param {Number} [duration] Duration of playback in seconds
        @chainable
    **/
    play: function(when, offset, duration) {
        if (!this._buffer) return;

        this._onStart();
        this.playing = true;

        when = when || 0;
        offset = offset || 0;
        duration = duration || this._buffer.duration - offset;

        if (!this._context) this._source = this._buffer;
        else this._source = this._context.createBufferSource();
        
        this._source.buffer = this._buffer;
        this._source.loop = this.loop;
        if (this._source.playbackRate) this._source.playbackRate.setValueAtTime(this.rate, this._context.currentTime);
        this._source.onended = this._onComplete.bind(this);
        if (this._source.connect) {
            this._source.connect(this._gainNode);
            this._source.startTime = this._context.currentTime - offset;
        }

        if (!this._context) {
            this._source.volume = this.volume;
            this._source.currentTime = 0;
            this._source.play();
        }
        else if (this.loop) {
            this._source.loopStart = game.Audio.loopStart;
            this._source.loopEnd = this._source.buffer.duration - game.Audio.loopEnd;
            this._source.start(this._context.currentTime + when, offset);
        }
        else {
            this._source.start(this._context.currentTime + when, offset, duration);
        }

        return this;
    },

    /**
        @method resume
    **/
    resume: function() {
        if (!this._source) return;
        if (!this.paused) return;

        this.paused = false;
        if (!this._source.pauseTime) return;

        this.play(0, this._source.pauseTime);
    },

    /**
        @method stop
        @param {Boolean} [skipOnComplete] Skip onComplete function
    **/
    stop: function(skipOnComplete) {
        if (!this._source) return;
        if (this.paused) return;

        this.playing = false;
        if (skipOnComplete) this.onComplete = null;
        if (!this._context) this._source.pause();
        else if (typeof this._source.playbackState !== 'number' || this._source.playbackState === 2) this._source.stop();
    },

    /**
        @method unmute
    **/
    unmute: function() {
        if (!this._gainNode) this._source.volume = this._volume;
        else this._gainNode.gain.setValueAtTime(this._volume, this._context.currentTime);
        this.muted = false;
    },

    /**
        @method _fade
        @param {Number} time
        @param {Number} to
        @private
    **/
    _fade: function(time, to) {
        if (!this._buffer) return;
        time = (time || 1000) / 1000;

        var currTime = this._context.currentTime;
        if (to === this.volume) this._gainNode.gain.setValueAtTime(0, this._context.currentTime);;
        var from = this._gainNode.gain.value;

        this._gainNode.gain.linearRampToValueAtTime(from, currTime);
        this._gainNode.gain.linearRampToValueAtTime(to, currTime + time);
    },

    /**
        @method _onComplete
        @private
    **/
    _onComplete: function() {
        game.audio.sounds.erase(this);
        if (this.paused) return;
        if (typeof this.onComplete === 'function') this.onComplete();
    },

    /**
        @method _onStart
        @private
    **/
    _onStart: function() {
        this.stop();
        game.audio.sounds.push(this);
    }
});

game.defineProperties('Sound', {
    /**
        Playback rate of audio (speed).
        @property {Number} rate
        @default 1
    **/
    rate: {
        get: function() {
            return this._rate;
        },

        set: function(value) {
            this._rate = value;
            if (this._source) this._source.playbackRate.value = value;
        }
    },

    /**
        Sound volume (0-1).
        @property {Number} volume
        @default game.Audio.soundVolume
    **/
    volume: {
        get: function() {
            return this._volume;
        },

        set: function(value) {
            this._volume = value;
            if (this._gainNode) this._gainNode.gain.setValueAtTime(value, this._context.currentTime);
        }
    }
});

/**
    @class Music
    @extends Sound
    @constructor
    @param {String} id Audio asset id
**/
game.createClass('Music', 'Sound', {
    /**
        @property {Boolean} loop
        @default true
    **/
    loop: true,

    init: function() {
        if (this._gainNode) this._gainNode.connect(game.audio._musicGain);
        this.volume = game.Audio.musicVolume;
    },

    _onStart: function() {
        if (game.audio.music) game.audio.music.stop();
        game.audio.music = this;
    }
});

});
