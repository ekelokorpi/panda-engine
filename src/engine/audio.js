/**
    @module audio
**/
game.module(
    'engine.audio'
)
.body(function() {

/**
    Audio manager.
    @class Audio
**/
game.createClass('Audio', {
    /**
        @property {AudioContext} context
    **/
    context: null,
    /**
        @property {Array} formats
    **/
    formats: [],
    /**
        @property {GainNode} mainGain
    **/
    mainGain: null,
    /**
        @property {Music} music
    **/
    music: null,
    /**
        @property {GainNode} musicGain
    **/
    musicGain: null,
    /**
        @property {Boolean} muted
        @default false
    **/
    muted: false,
    /**
        @property {GainNode} soundGain
    **/
    soundGain: null,
    /**
        @property {Array} sounds
    **/
    sounds: [],
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

    staticInit: function() {
        if (!game.Audio.enabled) return;
        
        game._normalizeVendorAttribute(window, 'AudioContext');

        if (!window.AudioContext) {
            game.Audio.enabled = false;
            return;
        }

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

        this.context = new AudioContext();

        this.mainGain = this.context.createGain();
        this.mainGain.connect(this.context.destination);

        this.musicGain = this.context.createGain();
        this.musicGain.gain.value = game.Audio.musicVolume;
        this.musicGain.connect(this.mainGain);

        this.soundGain = this.context.createGain();
        this.soundGain.gain.value = game.Audio.soundVolume;
        this.soundGain.connect(this.mainGain);
    },

    /**
        Mute all audio.
        @method mute
    **/
    mute: function() {
        if (!this.mainGain) return;
        this.mainGain.gain.value = 0;
        this.muted = true;
    },

    /**
        @method playMusic
        @param {String} name
    **/
    playMusic: function(name) {
        var music = new game.Music(name).play();
    },

    /**
        @method playSound
        @param {String} name
        @param {Number} [volume]
        @return {Sound}
    **/
    playSound: function(name, volume) {
        var sound = new game.Sound(name);
        sound.volume = volume || sound.volume;
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
        if (!this.mainGain) return;
        this.mainGain.gain.value = 1;
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
        this.context.decodeAudioData(
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

        var request = new XMLHttpRequest();
        request.open('GET', realPath, true);
        request.responseType = 'arraybuffer';
        request.onload = this._decode.bind(this, request, path, callback);
        request.send();
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
        @attribute {Object} cache
    **/
    cache: {},

    /**
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
        Initial music volume.
        @attribute {Number} musicVolume
        @default 1
    **/
    musicVolume: 1,

    /**
        Initial sound volume.
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
        @property {Boolean} loop
        @default false
    **/
    loop: false,
    /**
        Function to call, when sound is completed.
        @property {Function} onComplete
    **/
    onComplete: null,
    /**
        @property {Boolean} paused
        @default false
    **/
    paused: false,
    /**
        @property {Boolean} playing
        @default false
    **/
    playing: false,
    /**
        @property {Number} volume
        @default game.Audio.soundVolume
    **/
    volume: 0,
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

        this._context = game.audio.context;
        this._gainNode = this._context.createGain();
    },

    init: function() {
        this._gainNode.connect(game.audio.soundGain);
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
        if (!this._gainNode) return;
        this._gainNode.gain.value = 0;
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
        @param {Number} when When to start playback in seconds, 0 is now
        @param {Number} offset Offset of playback in seconds
        @param {Number} duration Duration of playback in seconds
    **/
    play: function(when, offset, duration) {
        if (!this._buffer) return;

        this._onStart();
        this.playing = true;

        when = when || 0;
        offset = offset || 0;
        duration = duration || this._buffer.duration - offset;

        this._source = this._context.createBufferSource();
        this._source.buffer = this._buffer;
        this._source.loop = this.loop;
        this._source.playbackRate.value = this.rate;
        this._source.onended = this._onComplete.bind(this);
        this._source.connect(this._gainNode);
        this._source.startTime = this._context.currentTime - offset;

        if (this.loop) {
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
        @param {Boolean} skipOnComplete Skip onComplete function
    **/
    stop: function(skipOnComplete) {
        if (!this._source) return;
        if (this.paused) return;

        this.playing = false;
        if (skipOnComplete) this.onComplete = null;
        if (typeof this._source.playbackState !== 'number' || this._source.playbackState === 2) this._source.stop();
    },

    /**
        @method unmute
    **/
    unmute: function() {
        if (!this._gainNode) return;
        this._gainNode.gain.value = this._volume;
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
        if (to === this.volume) this._gainNode.gain.value = 0;
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
        Speed of audio.
        @property {Number} rate
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
        @property {Number} volume
    **/
    volume: {
        get: function() {
            return this._volume;
        },

        set: function(value) {
            this._volume = value;
            if (this._gainNode) this._gainNode.gain.value = value;
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
        this._gainNode.connect(game.audio.musicGain);
        this.volume = game.Audio.musicVolume;
    },

    _onStart: function() {
        if (game.audio.music) game.audio.music.stop();
        game.audio.music = this;
    }
});

});
