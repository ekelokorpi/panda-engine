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
    clips: {},

    // Web Audio
    context: null,
    gainNode: null,

    // Sound
    loopedSounds: [],
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

        if(!request.response) throw('Error loading ' + path);

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
        if(this.clips[game.Audio.resources[path]]) throw('Duplicate audio ' + game.Audio.resources[path]);
        if(!game.Audio.resources[path]) throw('Cannot find cache for ' + path);

        this.clips[game.Audio.resources[path]] = audio;

        if(audio instanceof Audio) audio.removeEventListener('canplaythrough', this.loaded, false);

        if(callback) callback(path);
    },

    // Loading error
    loadError: function(path) {
        throw('Error loading ' + path);
    },

    // Get real path using correct format extension
    getPath: function(path) {
        return path.replace(/[^\.]+$/, this.format);
    },

    // Play audio
    play: function(path, volume, loop, rate) {
        if(!this.clips[path]) throw('Cannot find audio ' + path);

        // Web Audio
        if(this.context) {            
            var source = this.context.createBufferSource();
            source.buffer = this.clips[path];
            source.loop = loop;
            source.playbackRate.value = rate || 1;
            
            var gainNode;
            if(this.context.createGain) gainNode = this.context.createGain();
            else if(this.context.createGainNode) gainNode = this.context.createGainNode();
            gainNode.gain.value = volume || 1;

            gainNode.connect(this.gainNode);
            source.connect(gainNode);

            if(source.start) source.start();
            else if(source.noteOn) source.noteOn();
        }
        // HTML5 Audio
        else {
            this.clips[path].volume = volume || 1;
            this.clips[path].loop = loop;
            this.clips[path].play();
        }
    },

    playSound: function(name, volume, loop) {
        if(!game.Audio.enabled) return;
        if(this.soundMuted) return;

        volume = volume || 1;
        this.play(name, volume * this.soundVolume, loop);
        if(loop) this.loopedSounds.push(name);
    },

    playMusic: function(name, volume) {
        if(!game.Audio.enabled) return;
        if(this.musicMuted) return;

        volume = volume || 1;
        this.play(name, volume * this.soundVolume, loop);
        if(loop) this.loopedSounds.push(name);
    }
});

// Is audio enabled
game.Audio.enabled = false;

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