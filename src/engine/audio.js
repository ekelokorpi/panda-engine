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

        this.sources[game.Audio.resources[path]] = {
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
    play: function(name, volume, loop, rate) {
        if(!this.sources[name]) throw('Cannot find source: ' + name);

        // Web Audio
        if(this.context) {
            var audio = this.context.createBufferSource();
            audio.buffer = this.sources[name].audio;
            audio.loop = !!loop;
            audio.playbackRate.value = rate || 1;
            
            var gainNode;
            if(this.context.createGain) gainNode = this.context.createGain();
            else if(this.context.createGainNode) gainNode = this.context.createGainNode();
            gainNode.gain.value = volume || 1;

            gainNode.connect(this.gainNode);
            audio.connect(gainNode);

            if(audio.start) audio.start(0, this.sources[name].audio.pauseTime);
            else if(audio.noteOn) audio.noteOn(0, this.sources[name].audio.pauseTime);

            this.sources[name].clips.push(audio);
            this.sources[name].audio.volume = gainNode.gain.value; // Store volume info for pauses
            this.sources[name].audio.loop = audio.loop; // Store loop info for pauses
            this.sources[name].audio.startTime = this.context.currentTime - this.sources[name].audio.pauseTime || 0;
        }
        // HTML5 Audio
        else {
            this.sources[name].audio.volume = volume || 1;
            this.sources[name].audio.loop = loop;
            this.sources[name].audio.playing = true;
            this.sources[name].audio.play();
        }
    },

    // Stop audio
    stop: function(name) {
        if(!this.sources[name]) throw('Cannot find source: ' + name);

        // Web Audio
        if(this.context) {
            // Stop all source clips
            for (var i = 0; i < this.sources[name].clips.length; i++) {
                if(this.sources[name].clips[i].stop) this.sources[name].clips[i].stop();
                else if(this.sources[name].clips[i].noteOff) this.sources[name].clips[i].noteOff();
            }
            this.sources[name].clips.length = 0;
            this.sources[name].audio.pauseTime = 0;
        }
        // HTML5 Audio
        else {
            this.sources[name].audio.pause();
            this.sources[name].audio.playing = false;
            this.sources[name].audio.currentTime = 0;
        }
    },

    // Pause audio
    pause: function(name) {
        if(!this.sources[name]) throw('Cannot find source: ' + name);

        // Web Audio
        if(this.context) {
            // Stop all source clips
            for (var i = 0; i < this.sources[name].clips.length; i++) {
                if(this.sources[name].clips[i].stop) this.sources[name].clips[i].stop();
                else if(this.sources[name].clips[i].noteOff) this.sources[name].clips[i].noteOff();
            }
            this.sources[name].clips.length = 0;
            this.sources[name].audio.pauseTime = this.context.currentTime - this.sources[name].audio.startTime;

            if(this.sources[name].audio.pauseTime > this.sources[name].audio.duration && !this.sources[name].audio.loop) {
                // Trying to pause completed not looping sound
                this.sources[name].audio.pauseTime = 0;
            }
        }
        // HTML5 Audio
        else {
            if(this.sources[name].audio.currentTime > 0 && this.sources[name].audio.currentTime < this.sources[name].audio.duration || this.sources[name].audio.loop) {
                this.sources[name].audio.pause();
            }
        }
    },

    // Play audio as sound
    playSound: function(name, volume, loop) {
        if(!game.Audio.enabled) return;
        if(this.soundMuted) return;

        volume = volume || 1;
        this.play(name, volume * this.soundVolume, loop);
    },

    // Stop sound
    stopSound: function(name) {
        if(!game.Audio.enabled) return;

        if(name) {
            // Stop specific sound
            this.stop(name);
        } else {
            // Stop all sounds
            for(var i in this.sources) this.stop(i);
        }
    },

    // Play audio as music
    playMusic: function(name, volume) {
        if(!game.Audio.enabled) return;
        if(this.musicMuted) return;

        // Stop current music before playing new
        if(this.currentMusic) this.stop(this.currentMusic);
        this.currentMusic = name;

        volume = volume || 1;
        this.play(name, volume * this.musicVolume, true);
    },

    // Stop music
    stopMusic: function() {
        if(!game.Audio.enabled) return;

        if(this.currentMusic) this.stop(this.currentMusic);
        this.currentMusic = null;
    },

    // Pause all audio
    pauseAll: function() {
        if(!game.Audio.enabled) return;

        // Pause all sounds
        for(var i in this.sources) this.pause(i);
    },

    // Resuma all paused audio
    resumeAll: function() {
        if(!game.Audio.enabled) return;

        for(var name in this.sources) {
            if(this.context) {
                if(this.sources[name].audio.pauseTime) {
                    this.play(name, this.sources[name].audio.volume, this.sources[name].audio.loop);
                }
            } else {
                if(this.sources[name].audio.playing) this.sources[name].audio.play();
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

// List of audios to be loaded
game.Audio.resources = {};

});