/**
    @module audio
    @namespace game
**/
game.module(
    'engine.audio'
)
.body(function() {
'use strict';

/**
    Audio manager.
    @class Audio
    @extends game.Class
**/
game.Audio = game.Class.extend({
    audioId: 0,
    audioObjects: {},
    systemPaused: [],
    sources: {},
    context: null,
    gainNode: null,
    /**
        List of supported audio formats.
        @property {Array} formats
    **/
    formats: [],
    /**
        List of playing sounds.
        @property {Array} playingSounds
    **/
    playingSounds: [],
    /**
        List of paused sounds.
        @property {Array} pausedSounds
    **/
    pausedSounds: [],
    /**
        Main sound volume.
        @property {Number} soundVolume
        @default 1.0
    **/
    soundVolume: 1.0,
    /**
        Current music id.
        @property {Object} currentMusic
    **/
    currentMusic: null,
    /**
        Name of current music.
        @property {String} currentMusicName
    **/
    currentMusicName: null,
    /**
        Is music muted.
        @property {Boolean} musicMuted
        @default false
    **/
    musicMuted: false,
    /**
        Main music volume.
        @property {Number} musicVolume
        @default 1.0
    **/
    musicVolume: 1.0,
    /**
        Is sounds muted.
        @property {Boolean} soundMuted
        @default false
    **/
    soundMuted: false,

    init: function() {
        game.normalizeVendorAttribute(window, 'AudioContext');

        // Disable audio on iOS 5
        if (game.device.iOS5) game.Audio.enabled = false;

        // Disable audio on Windows Phone 7
        if (game.device.wp7) game.Audio.enabled = false;

        // Disable audio on Android 2
        if (game.device.android2) game.Audio.enabled = false;

        // Disable audio on mobile, when offline and not CocoonJS
        if (!game.device.cocoonJS && !navigator.onLine && game.device.mobile) game.Audio.enabled = false;

        // Disable Web Audio if audio disabled
        if (!game.Audio.enabled) game.Audio.webAudio = false;

        // Disable Web Audio if not supported
        if (game.Audio.webAudio && !window.AudioContext) game.Audio.webAudio = false;

        // Get supported audio formats
        if (game.Audio.enabled) {
            var audio = new Audio();
            for (var i = 0; i < game.Audio.formats.length; i++) {
                if (audio.canPlayType(game.Audio.formats[i].type)) {
                    this.formats.push(game.Audio.formats[i].ext);
                }
            }
        }

        // Remove m4a format on Opera, when using Web Audio (decode fails)
        if (game.device.opera && game.Audio.webAudio) this.formats.erase('m4a');

        // Disable audio if no compatible format found
        if (this.formats.length === 0) game.Audio.enabled = false;

        // Init Web Audio
        if (game.Audio.enabled && game.Audio.webAudio) {
            this.context = new AudioContext();

            if (this.context.createGain) this.gainNode = this.context.createGain();
            else if (this.context.createGainNode) this.gainNode = this.context.createGainNode();
            this.gainNode.connect(this.context.destination);
        }
    },

    decode: function(request, path, callback) {
        if (!this.context) return;

        if (!request.response) throw('Error loading audio: ' + path);

        this.context.decodeAudioData(
            request.response,
            this.loaded.bind(this, path, callback),
            this.error.bind(this, path)
        );
    },
    
    load: function(path, callback) {
        if (!game.Audio.enabled) {
            if (typeof callback === 'function') callback();
            return;
        }

        var ext = path.split('.').pop();
        if (this.formats.indexOf(ext) === -1) ext = this.formats[0];
        
        var realPath = path.replace(/[^\.]+$/, ext + game.nocache);

        // Web Audio
        if (this.context) {
            var request = new XMLHttpRequest();
            request.open('GET', realPath, true);
            request.responseType = 'arraybuffer';
            request.onload = this.decode.bind(this, request, path, callback);
            request.send();
        }
        // HTML5 Audio
        else {
            var audio = new Audio(realPath);
            if (game.device.ie) {
                // Sometimes IE fails to trigger events, when loading audio
                this.loaded(path, callback, audio);
            }
            else {
                audio.loadCallback = this.loaded.bind(this, path, callback, audio);
                audio.addEventListener('canplaythrough', audio.loadCallback, false);
                audio.addEventListener('error', this.error.bind(this, path), false);
            }
            audio.preload = 'auto';
            audio.load();
        }
    },

    loaded: function(path, callback, audio) {
        for (var name in game.paths) {
            if (game.paths[name] === path) var id = name;
        }
        if (!id) throw('No id found for audio source');

        this.sources[id] = {
            audio: audio,
            path: path
        };

        if (audio instanceof Audio) {
            audio.removeEventListener('canplaythrough', audio.loadCallback, false);
            audio.addEventListener('ended', function() {
                this.playing = false;
            }, false);
        }

        if (typeof callback === 'function') callback(path);
    },

    error: function(path) {
        throw('Error loading: ' + path);
    },

    onended: function(id) {
        var index = this.playingSounds.indexOf(id);
        if (index !== -1) this.playingSounds.splice(index, 1);

        if (id === this.currentMusic) {
            this.currentMusic = null;
            this.currentMusicName = null;
        }

        var audio = this.audioObjects[id];
        if (!audio) return false;

        if (typeof audio.callback === 'function') audio.callback();

        delete this.audioObjects[id];
    },

    play: function(name, loop, volume, callback, rate, time, audioId) {
        if (!game.Audio.enabled) return false;

        if (typeof volume !== 'number') volume = 1;
        if (typeof rate !== 'number') rate = 1;

        if (!audioId) {
            this.audioId++;
            audioId = this.audioId;
        }

        // Web Audio
        if (this.context) {
            var audio = this.context.createBufferSource();
            audio.buffer = this.sources[name].audio;
            audio.loop = !!loop;
            audio.playbackRate.value = rate;
            audio.callback = callback;
            audio.onended = this.onended.bind(this, audioId);

            var gainNode;
            if (this.context.createGain) gainNode = this.context.createGain();
            else if (this.context.createGainNode) gainNode = this.context.createGainNode();
            gainNode.gain.value = volume;

            gainNode.connect(this.gainNode);
            audio.connect(gainNode);
            audio.gainNode = gainNode;

            var startTime = time || 0;
            if (typeof audio.start === 'function') audio.start(0, startTime);
            else audio.noteOn(0, startTime);
            audio.startTime = this.context.currentTime - startTime;
        }
        // HTML5 Audio
        else {
            this.sources[name].audio.volume = volume;
            this.sources[name].audio.loop = loop;
            this.sources[name].audio.playing = true;
            this.sources[name].audio.callback = callback;
            this.sources[name].audio.onended = this.onended.bind(this, this.audioId);
            this.sources[name].audio.currentTime = 0;
            this.sources[name].audio.play();
            var audio = this.sources[name].audio;
        }

        this.audioObjects[audioId] = audio;
        return audioId;
    },

    stop: function(id, skipCallback) {
        if (!game.Audio.enabled) return false;

        var audio = this.audioObjects[id];
        if (!audio) return false;

        if (skipCallback) audio.callback = null;

        // Web Audio
        if (this.context) {
            if (typeof audio.stop === 'function') audio.stop(0);
            else audio.noteOff(0);
        }
        // HTML5 Audio
        else {
            // Is this fixed on CocoonJS ?
            if (navigator.isCocoonJS) audio.volume = 0;
            else audio.pause();
            audio.playing = false;
        }

        return true;
    },

    pause: function(id) {
        if (!game.Audio.enabled) return false;

        var audio = this.audioObjects[id];
        if (!audio) return false;

        // Web Audio
        if (this.context) {
            audio.onended = null;
            if (typeof audio.stop === 'function') audio.stop(0);
            else audio.noteOff(0);
            audio.pauseTime = (this.context.currentTime - audio.startTime) % audio.buffer.duration;
        }
        // HTML5 Audio
        else {
            if (audio.currentTime > 0 && audio.currentTime < audio.duration || audio.loop) {
                audio.pause();
            }
        }

        return true;
    },

    resume: function(id) {
        if (!game.Audio.enabled) return false;

        var audio = this.audioObjects[id];
        if (!audio) return false;

        // Web Audio
        if (this.context) {
            if (audio.pauseTime) {
                var audioName = this.getNameForAudio(audio);
                this.play(audioName, audio.loop, audio.gainNode.gain.value, audio.callback, audio.playbackRate, audio.pauseTime, id);
            }
            else return false;
        }
        // HTML5 Audio
        else {
            if (audio.playing) audio.play();
            else return false;
        }

        return true;
    },

    mute: function(id) {
        if (!game.Audio.enabled) return false;

        var audio = this.audioObjects[id];
        if (!audio) return false;

        // Web Audio
        if (this.context) {
            audio.gainNode.gain.value = 0;
        }
        // HTML5 Audio
        else {
            audio.volume = 0;
        }

        return true;
    },

    unmute: function(id, volume) {
        if (!game.Audio.enabled) return false;

        var audio = this.audioObjects[id];
        if (!audio) return false;

        // Web Audio
        if (this.context) {
            audio.gainNode.gain.value = volume || 1;
        }
        // HTML5 Audio
        else {
            audio.volume = volume || 1;
        }

        return true;
    },

    getNameForAudio: function(audio) {
        // Web Audio
        if (this.context) {
            for (var name in this.sources) {
                if (this.sources[name].audio === audio.buffer) return name;
            }
        }
        // HTML5 Audio
        else {
            for (var name in this.sources) {
                if (this.sources[name].audio === audio) return name;
            }
        }

        return false;
    },

    /**
        Play sound.
        @method playSound
        @param {String} name Name of sound
        @param {Boolean} [loop] Sound looping
        @param {Function} [callback] Callback when sound is finished
        @param {Number} [rate] Playback rate (Web Audio)
        @return {Number} id
    **/
    playSound: function(name, loop, callback, rate) {
        if (!game.Audio.enabled) return false;

        var volume = this.soundMuted ? 0 : this.soundVolume;
        var id = this.play(name, loop, volume, callback, rate);
        this.playingSounds.push(id);

        return id;
    },

    /**
        Stop specific or all sounds.
        @method stopSound
        @param {Number} [id] Id of sound
        @param {Boolean} [skipCallback] Skip callback function
        @return {Boolean}
    **/
    stopSound: function(id, skipCallback) {
        if (!game.Audio.enabled) return false;

        if (id) {
            return this.stop(id, !!skipCallback);
        }
        else {
            for (var i = this.playingSounds.length - 1; i >= 0; i--) {
                this.stop(this.playingSounds[i], !!skipCallback);
            }
            return true;
        }
    },

    /**
        Pause specific or all sounds.
        @method pauseSound
        @param {Number} [id] Id of sound
        @return {Boolean} Return false, if sound is not playing
    **/
    pauseSound: function(id) {
        if (!game.Audio.enabled) return false;

        if (id) {
            var index = this.playingSounds.indexOf(id);
            if (index === -1) return false;

            this.pause(id);
            this.playingSounds.splice(index, 1);
            this.pausedSounds.push(id);
        }
        else {
            for (var i = this.playingSounds.length - 1; i >= 0; i--) {
                this.pause(this.playingSounds[i]);
                this.pausedSounds.push(this.playingSounds[i]);
            }
            this.playingSounds.length = 0;
        }

        return true;
    },

    /**
        Resume sound.
        @method resumeSound
        @param {Number} id Id of sound
        @return {Boolean} Return false, if sound is not paused
    **/
    resumeSound: function(id) {
        if (!game.Audio.enabled) return false;

        var index = this.pausedSounds.indexOf(id);
        if (index === -1) return false;

        this.resume(id);
        this.playingSounds.push(id);
        this.pausedSounds.splice(index, 1);
        
        return true;
    },

    /**
        Mute specific sound or all sounds.
        @method muteSound
        @param {Number} [id] Id of sound
        @return {Boolean}
    **/
    muteSound: function(id) {
        if (!game.Audio.enabled) return false;

        if (id) {
            return this.mute(id);
        }
        else {
            this.soundMuted = true;
            var i;
            for (i = this.playingSounds.length - 1; i >= 0; i--) {
                this.mute(this.playingSounds[i]);
            }
            for (i = this.pausedSounds.length - 1; i >= 0; i--) {
                this.mute(this.pausedSounds[i]);
            }
            return true;
        }
    },

    /**
        Unmute specific sound or all sounds.
        @method unmuteSound
        @param {Number} [id] Id of sound
        @return {Boolean}
    **/
    unmuteSound: function(id) {
        if (!game.Audio.enabled) return false;

        if (id) {
            return this.unmute(id, this.soundVolume);
        }
        else {
            this.soundMuted = false;
            var i;
            for (i = this.playingSounds.length - 1; i >= 0; i--) {
                this.unmute(this.playingSounds[i], this.soundVolume);
            }
            for (i = this.pausedSounds.length - 1; i >= 0; i--) {
                this.unmute(this.pausedSounds[i], this.soundVolume);
            }
            return true;
        }
    },

    /**
        Play music.
        @method playMusic
        @param {Number} name Name of music
        @param {Boolean} [loop] Music looping
        @return {Boolean}
    **/
    playMusic: function(name, loop) {
        if (!game.Audio.enabled) return false;

        var volume = this.musicMuted ? 0 : this.musicVolume;
        
        if (typeof loop === 'undefined') loop = true;

        if (this.currentMusic) this.stop(this.currentMusic);
        
        this.currentMusic = this.play(name, !!loop, volume);
        this.currentMusicName = name;
        
        return !!this.currentMusic;
    },

    /**
        Stop current music.
        @method stopMusic
        @return {Boolean}
    **/
    stopMusic: function() {
        if (!game.Audio.enabled) return false;

        if (this.currentMusic) {
            var stop = this.stop(this.currentMusic);
            this.currentMusic = null;
            this.currentMusicName = null;
            return !!stop;
        }

        return false;
    },

    /**
        Pause current music.
        @method pauseMusic
        @return {Boolean}
    **/
    pauseMusic: function() {
        if (!game.Audio.enabled) return false;

        if (this.currentMusic) return this.pause(this.currentMusic);
        return false;
    },

    /**
        Resume current music.
        @method resumeMusic
        @return {Boolean}
    **/
    resumeMusic: function() {
        return this.resume(this.currentMusic);
    },

    /**
        Mute current music.
        @method muteMusic
    **/
    muteMusic: function() {
        if (!game.Audio.enabled) return false;

        this.musicMuted = true;
        if (this.currentMusic) this.mute(this.currentMusic);
    },

    /**
        Unmute current music.
        @method unmuteMusic
    **/
    unmuteMusic: function() {
        if (!game.Audio.enabled) return false;

        this.musicMuted = false;
        if (this.currentMusic) this.unmute(this.currentMusic, this.musicVolume);
    },

    /**
        Change main sound volume.
        @method setSoundVolume
        @param {Number} value
    **/
    setSoundVolume: function(value) {
        if (!game.Audio.enabled) return false;

        this.soundVolume = value;

        var i;
        for (i = this.playingSounds.length - 1; i >= 0; i--) {
            if (this.context) {
                this.audioObjects[this.playingSounds[i]].gainNode.gain.value = this.soundVolume;
            }
            else {
                this.playingSounds[i].volume = this.soundVolume;
            }
        }

        for (i = this.pausedSounds.length - 1; i >= 0; i--) {
            if (this.context) {
                this.audioObjects[this.pausedSounds[i]].gainNode.gain.value = this.soundVolume;
            }
            else {
                this.pausedSounds[i].volume = this.soundVolume;
            }
        }
    },

    /**
        Change music volume.
        @method setMusicVolume
        @param {Number} value
        @return {Boolean}
    **/
    setMusicVolume: function(value) {
        if (!game.Audio.enabled) return false;

        this.musicVolume = value;

        if (!this.currentMusic) return false;

        if (this.context) {
            this.audioObjects[this.currentMusic].gainNode.gain.value = this.musicVolume;
        }
        else {
            this.currentMusic.volume = this.musicVolume;
        }

        return true;
    },

    /**
        Change audio playback rate (Web Audio).
        @method setPlaybackRate
        @param {Object} audio
        @param {Number} rate
    **/
    setPlaybackRate: function(audio, rate) {
        if (!game.Audio.enabled) return false;

        if (audio && this.context) {
            audio.playbackRate.value = rate || 1;
        }
    },

    /**
        Check if sound is playing.
        @method isSoundPlaying
        @param {Number} id
        @return {Boolean}
    **/
    isSoundPlaying: function(id) {
        return this.playingSounds.indexOf(id) !== -1 ? true : false;
    },

    /**
        Check if music is playing.
        @method isMusicPlaying
        @return {Boolean}
    **/
    isMusicPlaying: function() {
        return !!this.currentMusic;
    },

    /**
        Toggle sounds on/off.
        @method toggleSound
        @return {Boolean}
    **/
    toggleSound: function() {
        if (!game.Audio.enabled) return false;

        this.soundMuted = !this.soundMuted;
        if (this.soundMuted) this.muteSound();
        else this.unmuteSound();

        return this.soundMuted;
    },

    /**
        Toggle music on/off.
        @method toggleMusic
        @return {Boolean}
    **/
    toggleMusic: function() {
        if (!game.Audio.enabled) return false;

        this.musicMuted = !this.musicMuted;
        if (this.musicMuted) this.muteMusic();
        else this.unmuteMusic();

        return this.musicMuted;
    },

    systemPause: function() {
        this.pauseMusic();

        for (var i = this.playingSounds.length - 1; i >= 0; i--) {
            this.pause(this.playingSounds[i]);
            this.systemPaused.push(this.playingSounds[i]);
        }
    },

    systemResume: function() {
        this.resumeMusic();

        for (var i = this.systemPaused.length - 1; i >= 0; i--) {
            this.resume(this.systemPaused[i]);
        }

        this.systemPaused.length = 0;
    }
});

/**
    Enable audio.
    @attribute {Boolean} enabled
    @default true
**/
game.Audio.enabled = true;
/**
    Enable Web Audio.
    @attribute {Boolean} webAudio
    @default true
**/
game.Audio.webAudio = true;
/**
    List of available audio formats.
    @attribute {Array} formats
**/
game.Audio.formats = [
    { ext: 'm4a', type: 'audio/mp4; codecs="mp4a.40.5"' },
    { ext: 'ogg', type: 'audio/ogg; codecs="vorbis"' },
    { ext: 'wav', type: 'audio/wav' }
];
/**
    Stop audio, when changing scene.
    @attribute {Boolean} stopOnSceneChange
    @default true
**/
game.Audio.stopOnSceneChange = true;

});
