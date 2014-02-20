/**
    Audio manager.
    
    @module audio
    @namespace game
**/
game.module(
    'engine.audio'
)
.body(function(){ 'use strict';

game.Audio = game.Class.extend({
    format: null,
    sources: {},

    // Web Audio
    context: null,
    gainNode: null,

    // Sound
    soundMuted: false,
    soundVolume: 1.0,

    // Music
    currentMusic: null,
    musicMuted: false,
    musicVolume: 1.0,

    init: function() {
        game.normalizeVendorAttribute(window, 'AudioContext');

        // Disable audio on Windows Phone
        if(game.device.wp) game.Audio.enabled = false;

        // Disable audio on mobile, when offline
        // if(!navigator.onLine && game.device.mobile) game.Audio.enabled = false;

        // Disable Web Audio if audio disabled
        if(!game.Audio.enabled) game.Audio.webAudio = false;

        // Disable Web Audio if not supported
        if(game.Audio.webAudio && !window.AudioContext) game.Audio.webAudio = false;

        // Get audio format
        if(game.Audio.enabled) {
            var audio = new Audio();
            for (var i = 0; i < game.Audio.formats.length; i++) {
                if(audio.canPlayType(game.Audio.formats[i].type)) {
                    this.format = game.Audio.formats[i].ext;
                    break;
                }
            }
        }

        // Disable audio if no compatible format found
        if(!this.format) game.Audio.enabled = false;

        // Init Web Audio
        if(game.Audio.enabled && game.Audio.webAudio) {
            this.context = new AudioContext();

            if(this.context.createGain) this.gainNode = this.context.createGain();
            else if(this.context.createGainNode) this.gainNode = this.context.createGainNode();
            this.gainNode.connect(this.context.destination);
        }
    },

    // Decode audio for Web Audio
    decode: function(request, path, callback) {
        if(!this.context) return;

        if(!request.response) throw('Error loading audio: ' + path);

        this.context.decodeAudioData(
            request.response,
            this.loaded.bind(this, path, callback),
            this.loadError.bind(this, path)
        );
    },

    // Load audio
    load: function(path, callback) {
        if(!game.Audio.enabled) return callback ? callback() : false;

        var realPath = this.getPath(path);

        // Web Audio
        if(this.context) {
            var request = new XMLHttpRequest();
            request.open('GET', realPath, true);
            request.responseType = 'arraybuffer';
            request.onload = this.decode.bind(this, request, path, callback);
            request.send();
        }
        // HTML5 Audio
        else {
            var audio = new Audio(realPath);
            audio.addEventListener('canplaythrough', this.loaded.bind(this, path, callback, audio), false);
            audio.addEventListener('error', this.loadError.bind(this, path), false);
            audio.preload = 'auto';
            audio.load();
        }
    },

    // Audio loaded
    loaded: function(path, callback, audio) {
        if(this.sources[game.Audio.resources[path]]) throw('Duplicate audio source: ' + game.Audio.resources[path]);
        if(!game.Audio.resources[path]) throw('Cannot find audio resource: ' + path);

        // Get id for path
        var id = game.Audio.resources[path];

        this.sources[id] = {
            clips: [],
            audio: audio,
        };

        if(audio instanceof Audio) {
            audio.removeEventListener('canplaythrough', this.loaded, false);
            audio.addEventListener('ended', function() {
                this.playing = false;
            }, false);
        }

        if(callback) callback(path);
    },

    // Loading error
    loadError: function(path) {
        throw('Error loading: ' + path);
    },

    // Get real path using correct format extension
    getPath: function(path) {
        return path.replace(/[^\.]+$/, this.format);
    },

    // Play audio
    play: function(id, volume, loop, callback, rate) {
        if(!this.sources[id]) throw('Cannot find source: ' + id);

        // Web Audio
        if(this.context) {
            var audio = this.context.createBufferSource();
            audio.buffer = this.sources[id].audio;
            audio.loop = !!loop;
            audio.playbackRate.value = rate || 1;
            if(typeof(callback) === 'function') audio.onended = callback.bind(this);
            else audio.onended = null;

            var gainNode;
            if(this.context.createGain) gainNode = this.context.createGain();
            else if(this.context.createGainNode) gainNode = this.context.createGainNode();
            gainNode.gain.value = volume || 1;

            gainNode.connect(this.gainNode);
            audio.connect(gainNode);

            if(audio.start) audio.start(0, this.sources[id].audio.pauseTime);
            else if(audio.noteOn) audio.noteOn(0, this.sources[id].audio.pauseTime);

            this.sources[id].clips.push(audio);
            this.sources[id].audio.volume = gainNode.gain.value; // Store volume info for pauses
            this.sources[id].audio.loop = audio.loop; // Store loop info for pauses
            this.sources[id].audio.startTime = this.context.currentTime - this.sources[id].audio.pauseTime || 0;
        }
        // HTML5 Audio
        else {
            this.sources[id].audio.volume = volume || 1;
            this.sources[id].audio.loop = loop;
            this.sources[id].audio.playing = true;
            if(typeof(callback) === 'function') this.sources[id].audio.onended = callback.bind(this);
            else this.sources[id].audio.onended = null;
            this.sources[id].audio.play();
        }
    },

    // Stop audio
    stop: function(id) {
        if(!this.sources[id]) throw('Cannot find source: ' + id);

        // Web Audio
        if(this.context) {
            // Stop all source clips
            for (var i = 0; i < this.sources[id].clips.length; i++) {
                if(this.sources[id].clips[i].stop) this.sources[id].clips[i].stop();
                else if(this.sources[id].clips[i].noteOff) this.sources[id].clips[i].noteOff();
            }
            this.sources[id].clips.length = 0;
            this.sources[id].audio.pauseTime = 0;
        }
        // HTML5 Audio
        else {
            this.sources[id].audio.pause();
            this.sources[id].audio.playing = false;
            this.sources[id].audio.currentTime = 0;
        }
    },

    // Pause audio
    pause: function(id) {
        if(!this.sources[id]) throw('Cannot find source: ' + id);

        // Web Audio
        if(this.context) {
            // Stop all source clips
            for (var i = 0; i < this.sources[id].clips.length; i++) {
                if(this.sources[id].clips[i].stop) this.sources[id].clips[i].stop();
                else if(this.sources[id].clips[i].noteOff) this.sources[id].clips[i].noteOff();
            }
            this.sources[id].clips.length = 0;
            this.sources[id].audio.pauseTime = this.context.currentTime - this.sources[id].audio.startTime;

            if(this.sources[id].audio.pauseTime > this.sources[id].audio.duration && !this.sources[id].audio.loop) {
                // Trying to pause completed not looping sound
                this.sources[id].audio.pauseTime = 0;
            }
        }
        // HTML5 Audio
        else {
            if(this.sources[id].audio.currentTime > 0 && this.sources[id].audio.currentTime < this.sources[id].audio.duration || this.sources[id].audio.loop) {
                this.sources[id].audio.pause();
            }
        }
    },

    // Play audio as sound
    playSound: function(id, volume, loop, callback, rate) {
        if(!game.Audio.enabled) return;
        if(this.soundMuted) return;

        volume = volume || 1;
        this.play(id, volume * this.soundVolume, loop, callback, rate);
    },

    // Stop sound
    stopSound: function(id) {
        if(!game.Audio.enabled) return;

        if(id) {
            // Stop specific sound
            this.stop(id);
        } else {
            // Stop all sounds
            for(var i in this.sources) this.stop(i);
        }
    },

    // Play audio as music
    playMusic: function(id, volume) {
        if(!game.Audio.enabled) return;
        if(this.musicMuted) return;

        // Stop current music before playing new
        if(this.currentMusic) this.stop(this.currentMusic);
        this.currentMusic = id;

        volume = volume || 1;
        this.play(id, volume * this.musicVolume, true);
    },

    // Stop music
    stopMusic: function() {
        if(!game.Audio.enabled) return;

        if(this.currentMusic) this.stop(this.currentMusic);
        this.currentMusic = null;
    },

    // Pause sound
    pauseSound: function(id) {
        if(!game.Audio.enabled) return;

        this.pause(id);
    },

    // Pause all audio
    pauseAll: function() {
        if(!game.Audio.enabled) return;

        for(var id in this.sources) this.pause(id);
    },

    // Resuma all paused audio
    resumeAll: function() {
        if(!game.Audio.enabled) return;

        for(var id in this.sources) {
            if(this.context) {
                if(this.sources[id].audio.pauseTime) {
                    this.play(id, this.sources[id].audio.volume, this.sources[id].audio.loop);
                }
            } else {
                if(this.sources[id].audio.playing) this.sources[id].audio.play();
            }
        }
    }
});

// Is audio enabled
game.Audio.enabled = true;

// Is Web Audio enabled
game.Audio.webAudio = true;

// List of supported formats
game.Audio.formats = [
    {ext: 'm4a', type: 'audio/mp4; codecs="mp4a.40.5"'},
    {ext: 'ogg', type: 'audio/ogg; codecs="vorbis"'}
];

// List of audios to be loaded (contains path and id)
game.Audio.resources = {};

});