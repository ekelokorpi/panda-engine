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
    buffers: {},
    context: null,
    formats: [],
    mainGain: null,
    music: null,
    musicGain: null,
    muted: false,
    soundGain: null,
    sounds: [],

    staticInit: function() {
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

        this.mainGain = this.context.createGain ? this.context.createGain() : this.context.createGainNode();
        this.mainGain.connect(this.context.destination);

        this.musicGain = this.context.createGain ? this.context.createGain() : this.context.createGainNode();
        this.musicGain.gain.value = game.Audio.musicVolume;
        this.musicGain.connect(this.mainGain);

        this.soundGain = this.context.createGain ? this.context.createGain() : this.context.createGainNode();
        this.soundGain.gain.value = game.Audio.soundVolume;
        this.soundGain.connect(this.mainGain);
    },

    mute: function() {
        if (!this.mainGain) return;
        this.mainGain.gain.value = 0;
        this.muted = true;
    },

    toggle: function() {
        if (this.muted) this.unmute();
        else this.mute();
        return this.muted;
    },

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
        @method _load
        @param {String} path
        @param {Function} callback
        @private
    **/
    _load: function(path, callback) {
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
        @method _error
        @param {String} path
        @param {Function} callback
        @private
    **/
    _error: function(path, callback) {
        callback('Error loading audio ' + path);
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
        this.buffers[id] = buffer;
        callback();
    },

    /**
        @method _systemPause
        @private
    **/
    _systemPause: function() {
        console.log('TODO');
    },

    /**
        @method _systemResume
        @private
    **/
    _systemResume: function() {
        console.log('TODO');
    }
});

game.addAttributes('Audio', {
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
        Stop audio, when changing scene.
        @attribute {Boolean} stopOnSceneChange
        @default true
    **/
    stopOnSceneChange: true
});

game.createClass('Sound', {
    loop: false,
    onComplete: null,
    paused: false,
    playing: false,
    _buffer: null,
    _context: null,
    _gain: null,
    _rate: 1,
    _source: null,
    _volume: 1,

    staticInit: function(id) {
        if (!game.Audio.enabled) return true;

        this._buffer = game.audio.buffers[id];
        if (!this._buffer) throw 'Audio ' + id + ' not found';

        this._context = game.audio.context;
        this._gain = this._context.createGain();
    },

    init: function() {
        this._gain.connect(game.audio.soundGain);
        this.volume = game.Audio.soundVolume;
    },

    fadeIn: function(time) {
        this._fade(time, this.volume);
    },

    fadeOut: function(time) {
        this._fade(time, 0);
    },

    mute: function() {
        if (!this._gain) return;
        this._gain.gain.value = 0;
    },

    pause: function() {
        if (!this._source) return;
        if (this.paused) return;
        if (!this.playing) return;

        this.paused = true;
        this.stop();
        this._source.pauseTime = (this._context.currentTime - this._source.startTime) % this._buffer.duration;
    },

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
        this._source.connect(this._gain);
        this._source.startTime = this._context.currentTime - offset;

        if (this.loop) {
            this._source.start(this._context.currentTime + when, offset);
        }
        else {
            this._source.start(this._context.currentTime + when, offset, duration);
        }

        return this;
    },

    resume: function() {
        if (!this._source) return;
        if (!this.paused) return;

        this.paused = false;
        if (!this._source.pauseTime) return;

        this.play(0, this._source.pauseTime);
    },

    stop: function(skipOnComplete) {
        if (!this._source) return;

        this.playing = false;
        if (skipOnComplete) this.onComplete = null;
        this._source.stop(0);
    },

    unmute: function() {
        if (!this._gain) return;
        this._gain.gain.value = this._volume;
    },

    _fade: function(time, to) {
        if (!this._buffer) return;
        time = time || 1;

        var currTime = this._context.currentTime;
        if (to === this.volume) this._gain.gain.value = 0;
        var from = this._gain.gain.value;

        this._gain.gain.linearRampToValueAtTime(from, currTime);
        this._gain.gain.linearRampToValueAtTime(to, currTime + time);
    },

    _onComplete: function() {
        game.audio.sounds.erase(this);
        if (this.paused) return;
        if (typeof this.onComplete === 'function') this.onComplete();
    },

    _onStart: function() {
        this.stop();
        game.audio.sounds.push(this);
    }
});

game.defineProperties('Sound', {
    rate: {
        get: function() {
            return this._rate;
        },

        set: function(value) {
            this._rate = value;
            if (this._source) this._source.playbackRate.value = value;
        }
    },

    volume: {
        get: function() {
            return this._volume;
        },

        set: function(value) {
            this._volume = value;
            if (this._gain) this._gain.gain.value = value;
        }
    }
});

game.createClass('Music', 'Sound', {
    loop: true,

    init: function() {
        this._gain.connect(game.audio.musicGain);
        this.volume = game.Audio.musicVolume;
    },

    _onStart: function() {
        if (game.audio.music) game.audio.music.stop();
        game.audio.music = this;
    }
});

});
