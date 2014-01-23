game.module(
    'engine.sound',
    '1.0.0'
)
.body(function(){ 'use strict';
    
game.SoundManager = game.Class.extend({
    clips: {},
    loopedSounds: [],
    format: null,
    context: null,
    gainNode: null,
    _muteMusic: false,
    _muteSound: false,
    currentMusic: null,
    soundVolume: 1.0,
    musicVolume: 0.5,

    init: function(){
        if(game.ua.wp) game.Sound.enabled = false;
        
        if(!game.Sound.enabled) game.Sound.webAudio = false;

        if(game.Sound.webAudio) {
            if(!window.webkitAudioContext && !window.AudioContext) {
                game.Sound.webAudio = false;
            }
        }

        if(!navigator.onLine && game.ua.mobile) {
            game.Sound.webAudio = game.Sound.enabled = false;
        }

        if(game.Sound.enabled && !game.Sound.webAudio && !window.Audio ) {
            game.Sound.enabled = false;
        }

        if(game.Sound.webAudio && game.Sound.enabled) {
            game.normalizeVendorAttribute(window, 'AudioContext');

            if(window.AudioContext) {
                this.context = new AudioContext();
                if(this.context.createGain) this.gainNode = this.context.createGain();
                else if(this.context.createGainNode) this.gainNode = this.context.createGainNode();
                this.gainNode.connect(this.context.destination);
            } else {
                game.Sound.webAudio = false;
            }
        }

        if(game.Sound.enabled) {
            // Probe sound formats and determine the file extension to load
            var probe = new Audio();
            for(var i = 0; i < game.Sound.use.length; i++) {
                var format = game.Sound.use[i];
                if(probe.canPlayType(format.mime)) {
                    this.format = format;
                    break;
                }
            }
            
            // No compatible format found? -> Disable sound
            if(!this.format) {
                game.Sound.enabled = false;
            }
        }
        
        if(!game.Sound.enabled) {
            // clean game.SoundCache and game.MusicCache
            game.SoundCache = {};
            game.MusicCache = {};
        }
    },
        
    get: function(path) {
        // Find and return a channel that is not currently playing
        var channels = this.clips[path];
        for(var i = 0, clip; clip = channels[i++];) {
            if(clip.paused || clip.ended) {
                if(clip.ended) {
                    clip.currentTime = 0;
                }
                return clip;
            }
        }
        
        // Still here? Pause and rewind the first channel
        channels[0].pause();
        channels[0].currentTime = 0;
        return channels[0];
    },

    getWebAudio: function(path) {
        if(this.context) {
            return this.clips[path];
        }
    },

    unlock: function() {
        if(!this.context) return;
        var buffer = this.context.createBuffer(1, 1, 22050);
        var source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.context.destination);
        if(source.start) source.start(0);
        else if(source.noteOn) source.noteOn(0);
    },

    decode: function(path, node, loadCallback) {
        var me = this;

        try {
            this.context.decodeAudioData(node, function(buffer) {
                me.clips[path] = [];
                me.clips[path].buffer = buffer;
                if(loadCallback) loadCallback(path, true, buffer);
            }, function() {
                if(loadCallback) loadCallback(path, false);
            });
        } catch(e) {
            if(loadCallback) loadCallback(path, false);
        }
    },

    load: function(path, multiChannel, loadCallback) {
        var a, i, realPath = path.replace(/[^\.]+$/, this.format.ext) + game.nocache;

        if(this.context) {
            var request = new XMLHttpRequest();
            request.open('GET', realPath, true);
            request.responseType = 'arraybuffer';

            var me = this;
            request.onload = function() {
                if(request.response) me.decode(path, request.response, loadCallback);
                else throw 'Null request response on '+realPath;
            };
            request.send();
            return;
        }

        // Sound file already loaded?
        if(this.clips[path]) {
            
            // Only loaded as single channel and now requested as multichannel?
            if(multiChannel && this.clips[path].length < game.Sound.channels) {
                for(i = this.clips[path].length; i < game.Sound.channels; i++ ) {
                    a = new Audio(realPath);
                    a.load();
                    this.clips[path].push(a);
                }
            }
            return this.clips[path][0];
        }
        
        var clip = new Audio(realPath);
        if(loadCallback) {
            
            // The canplaythrough event is dispatched when the browser determines
            // that the sound can be played without interuption, provided the
            // download rate doesn't change.
            // FIXME: Mobile Safari doesn't seem to dispatch this event at all?
            clip.addEventListener('canplaythrough', function cb(ev){
                clip.removeEventListener('canplaythrough', cb, false);
                loadCallback(path, true, ev);
            }, false);
            
            clip.addEventListener('error', function(ev){
                loadCallback(path, false, ev);
            }, false);
        }
        clip.preload = 'auto';
        clip.load();
        
        
        this.clips[path] = [clip];
        if(multiChannel) {
            for(i = 1; i < game.Sound.channels; i++ ) {
                a = new Audio(realPath);
                a.load();
                this.clips[path].push(a);
            }
        }
        
        return clip;
    },

    playSound: function(name, loop, delay) {
        if(!game.Sound.enabled || game.sound._muteSound || typeof(game.SoundCache[name]) === 'undefined') return;
        game.SoundCache[name].play(!!loop, delay);
        if(loop) this.loopedSounds.push(game.SoundCache[name]);
    },

    stopSound: function(name) {
        if(!game.Sound.enabled) return;

        if(name) {
            if(typeof(game.SoundCache[name]) === 'undefined') return;
            game.SoundCache[name].stop();
            for (var i = 0; i < game.sound.loopedSounds.length; i++) {
                if(game.sound.loopedSounds[i] === game.SoundCache[name]) game.sound.loopedSounds.erase(game.SoundCache[name]);
            }
        } else {
            for(var sound in game.SoundCache) {
                game.SoundCache[sound].stop();
            }
            this.loopedSounds.length = 0;
        }
    },

    muteSound: function() {
        if(this._muteSound) return;
        this._muteSound = true;
        for(var sound in game.SoundCache) {
            if(game.SoundCache[sound].playing) game.SoundCache[sound].stop();
        }
    },

    unmuteSound: function() {
        if(!this._muteSound) return;
        this._muteSound = false;
        for (var i = 0; i < this.loopedSounds.length; i++) {
            this.loopedSounds[i].play(true);
        }
    },

    toggleSound: function() {
        this._muteSound = !this._muteSound;
        if(this._muteSound) this.muteSound();
        else this.unmuteSound();
    },

    playMusic: function(name) {
        if(!game.Sound.enabled || this._muteMusic || typeof(game.MusicCache[name]) === 'undefined') return;
        
        if(this.currentMusic && this.currentMusic.playing) this.currentMusic.stop();
        game.MusicCache[name].play();
        this.currentMusic = game.MusicCache[name];
    },

    stopMusic: function() {
        if(!game.Sound.enabled) return;

        if(this.currentMusic) {
            if(navigator.isCocoonJS) {
                // BUG
                // CocoonJS drops ~5fps when stopping music (but not when stopping sound, filesize?)
                this.currentMusic.currentClip.volume = 0;
            } else {
                this.currentMusic.stop();
            }
            this.currentMusic = null;
        }
    },

    muteMusic: function() {
        if(this._muteMusic) return;
        this._muteMusic = true;
        if(this.currentMusic) this.currentMusic.stop();
    },

    unmuteMusic: function() {
        if(!this._muteMusic) return;
        this._muteMusic = false;
        if(this.currentMusic) this.currentMusic.play();
    },

    toggleMusic: function() {
        this._muteMusic = !this._muteMusic;
        if(this._muteMusic) this.muteMusic();
        else this.unmuteMusic();
    },

    stopAll: function() {
        this.stopSound();
        this.stopMusic();
    },

    muteAll: function() {
        this.muteSound();
        this.muteMusic();
    },

    unmuteAll: function() {
        this.unmuteSound();
        this.unmuteMusic();
    }
});

game.Sound = game.Class.extend({
    path: '',
    volume: 1,
    currentClip: null,
    multiChannel: true,
    gainNode: null,
    playbackRate: 1,
    loop: false,
    
    init: function(path, multiChannel) {
        this.path = path;
        this.multiChannel = (multiChannel !== false);
        
        this.load();
    },

    load: function(loadCallback) {
        if(game.ready) {
            if(game.sound.context) {
                if(game.sound.context.createGain) this.gainNode = game.sound.context.createGain();
                else if(game.sound.context.createGainNode) this.gainNode = game.sound.context.createGainNode();
                this.gainNode.connect(game.sound.gainNode);
            }
        }

        if(!game.Sound.enabled) {
            if(loadCallback) {
                loadCallback(this.path, true);
            }
            return;
        }
        
        if(game.ready) {
            game.sound.load(this.path, this.multiChannel, loadCallback);
        }
        else {
            game.audioResources.push(this);
        }

        if(game.ready && game.sound && !game.Sound.webAudio && game.Sound.enabled) {
            this.currentClip = game.sound.get(this.path);
            this.currentClip.addEventListener('ended', this.ended.bind(this), false);
        }
    },

    ended: function() {
        if(this.loop) this.play();
        else this.playing = false;
    },

    prePlay: function(loop) {
        this.loop = !!loop;
        this._volume = game.sound.soundVolume * this.volume;
        return true;
    },

    play: function(loop, delay) {
        if(!game.Sound.enabled) return;
        
        if(!this.prePlay(loop)) return;

        this.playing = true;

        if(game.sound.context) {
            // Web Audio
            this.currentClip = game.sound.getWebAudio(this.path);
            
            var source = game.sound.context.createBufferSource();
            source.buffer = this.currentClip.buffer;
            source.loop = this.loop;
            this.gainNode.gain.value = this._volume;
            source.playbackRate.value = this.playbackRate;
            source.connect(this.gainNode);
            this.currentClip.source = source;
            var _delay = delay ? game.sound.context.currentTime + delay : 0;
            if(this.currentClip.source.start) this.currentClip.source.start(_delay);
            else if(this.currentClip.source.noteOn) this.currentClip.source.noteOn(_delay);
        } else {
            // HTML5 Audio
            this.currentClip = game.sound.get(this.path);
            this.currentClip.volume = this._volume;
            this.currentClip.play();
        }
    },

    setPlaybackRate: function(value) {
        if(!game.Sound.enabled || !game.Sound.webAudio) return;

        this.playbackRate = value;
        this.currentClip = game.sound.getWebAudio(this.path);
        if(game.sound.context && this.currentClip.source) {
            this.currentClip.source.playbackRate.value = this.playbackRate;
        }
    },

    setLoop: function(value) {
        this.loop = !!value;
    },

    setVolume: function(value) {
        if(!game.Sound.enabled || !game.Sound.webAudio) {
            if(this.currentClip) this.currentClip.volume = value;
            return;
        }
        
        if(game.sound.context && this.gainNode) {
            this.gainNode.gain.value = value;
        }
    },

    stop: function() {
        if(!game.Sound.enabled) return;

        this.playing = false;

        if(this.currentClip && game.sound.context) {
            // Web Audio
            if(this.currentClip.source) {
                if(this.currentClip.source.stop) this.currentClip.source.stop(0);
                else if(this.currentClip.source.noteOff) this.currentClip.source.noteOff(0);
            }
        } else {
            // HTML5 Audio
            if(this.currentClip) {
                this.currentClip.pause();
                this.currentClip.currentTime = 0;
            }
        }
    }
});

game.Music = game.Sound.extend({
    prePlay: function() {
        this.loop = true;
        this._volume = game.sound.musicVolume * this.volume;
        return true;
    }
});

game.SoundCache = {};
game.MusicCache = {};

game.Sound.FORMAT = {
    MP3: {ext: 'mp3', mime: 'audio/mpeg'},
    M4A: {ext: 'm4a', mime: 'audio/mp4; codecs=mp4a'},
    OGG: {ext: 'ogg', mime: 'audio/ogg; codecs=vorbis'},
    WEBM: {ext: 'webm', mime: 'audio/webm; codecs=vorbis'},
    CAF: {ext: 'caf', mime: 'audio/x-caf'}
};

game.Sound.use = [game.Sound.FORMAT.OGG, game.Sound.FORMAT.M4A];
game.Sound.channels = 4;
game.Sound.enabled = true;
game.Sound.webAudio = true;

});