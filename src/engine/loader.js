/**
    @module loader
**/
game.module(
    'engine.loader'
)
.body(function() {
'use strict';

/**
    Dynamic loader for assets and audio files.
    @class Loader
    @extends Class
    @constructor
    @param {Function|String} callback Callback function or scene name
**/
game.createClass('Loader', {
    /**
        List of assets to load.
        @property {Array} assetQueue
        @private
    **/
    _assetQueue: [],
    /**
        List of audios to load.
        @property {Array} audioQueue
        @private
    **/
    _audioQueue: [],
    /**
        Callback for loader.
        @property {Function|String} _callback
        @private
    **/
    _callback: null,
    /**
        Is loader in dynamic mode.
        @property {Boolean} _dynamic
        @private
    **/
    _dynamic: true,
    /**
        Number of files loaded.
        @property {Number} loaded
    **/
    loaded: 0,
    /**
        Percent of files loaded.
        @property {Number} percent
    **/
    percent: 0,
    /**
        Is loader started.
        @property {Boolean} started
        @default false
    **/
    started: false,
    
    init: function(callback) {
        this.onComplete(callback);
        this.stage = new game.Container();

        for (var i = 0; i < game.assetQueue.length; i++) {
            if (game.TextureCache[game.assetQueue[i]]) continue;
            this._assetQueue.push(this._getPath(game.assetQueue[i]));
        }
        game.assetQueue.length = 0;

        if (game.Audio.enabled) {
            for (var i = 0; i < game.audioQueue.length; i++) {
                this._audioQueue.push(game.audioQueue[i]);
            }
            game.audioQueue.length = 0;
        }

        if (this._assetQueue.length > 0) {
            this.loader = new game.AssetLoader();
            for (var i = 0; i < this._assetQueue.length; i++) {
                this.loader.add(this._assetQueue[i]);
            }
            this.loader.once('progress', this._progress.bind(this));
            this.loader.once('complete', this._loadAudio.bind(this));
            this.loader.once('error', this.error.bind(this));
        }

        if (this._assetQueue.length + this._audioQueue.length === 0) this.percent = 100;
    },

    /**
        @method _progress
        @private
    **/
    _progress: function(loader) {
        if (loader && loader.json) game.json[loader.url] = loader.json;
        this.loaded++;
        this.percent = Math.round(this.loaded / (this._assetQueue.length + this._audioQueue.length) * 100);
        this.onPercentChange();

        if (this._dynamic && this.loaded === this._assetQueue.length + this._audioQueue.length) this._ready();
    },

    /**
        @method _loadAudio
        @private
    **/
    _loadAudio: function() {
        for (var i = this._audioQueue.length - 1; i >= 0; i--) {
            game.audio._load(this._audioQueue[i], this._progress.bind(this), this.error.bind(this, this._audioQueue[i]));
        }
    },

    /**
        @method _ready
        @private
    **/
    _ready: function() {
        if (game.system.hires || game.system.retina) {
            for (var i in game.TextureCache) {
                if (i.indexOf('@' + game.scale + 'x') !== -1) {
                    game.TextureCache[i.replace('@' + game.scale + 'x', '')] = game.TextureCache[i];
                    delete game.TextureCache[i];
                }
            }
        }

        if (typeof this._callback === 'function') this._callback();
        else this._setScene();
    },

    /**
        @method _setScene
        @private
    **/
    _setScene: function() {
        game.system.timer.last = 0;
        game.Timer.time = Number.MIN_VALUE;
        if (this.loopId) game._clearGameLoop(this.loopId);
        game.system.setScene(this._callback);
    },

    /**
        @method _run
        @private
    **/
    _run: function() {
        if (this.loopId) {
            this.last = game.Timer.time;
            game.Timer.update();
            game.system.delta = (game.Timer.time - this.last) / 1000;
        }

        this._update();
        this._render();
    },

    /**
        @method _update
        @private
    **/
    _update: function() {
        if (game.tweenEngine) game.tweenEngine.update();

        if (this._isReady) return;
        if (this.timeoutTimer) {
            if (this.timeoutTimer.time() >= 0) {
                this._isReady = true;
                this._ready();
            }
        }
        else if (this.loaded === this._assetQueue.length + this._audioQueue.length) {
            var loadTime = Date.now() - this.startTime;
            var waitTime = Math.max(0, game.Loader.time - loadTime);
            this.timeoutTimer = new game.Timer(waitTime);
        }
    },

    /**
        @method _render
        @private
    **/
    _render: function() {
        game.system.renderer.render(this.stage);
    },

    /**
        @method _getPath
        @private
    **/
    _getPath: function(path) {
        return game.system.retina || game.system.hires ? path.replace(/\.(?=[^.]*$)/, '@' + game.scale + 'x.') : path;
    },

    /**
        Init loader stage, when not using dynamic mode.
        @method initStage
    **/
    initStage: function() {
        var barWidth = game.Loader.barWidth * game.scale;
        var barHeight = game.Loader.barHeight * game.scale;

        this.barBg = new game.Graphics();
        this.barBg.beginFill(game.Loader.barBgColor);
        this.barBg.drawRect(0, 0, barWidth, barHeight);
        this.barBg.position.set(Math.round(game.system.width / 2 - (barWidth / 2)), Math.round(game.system.height / 2 - (barHeight / 2)));
        this.stage.addChild(this.barBg);

        this.barFg = new game.Graphics();
        this.barFg.beginFill(game.Loader.barColor);
        this.barFg.drawRect(0, 0, barWidth, barHeight);
        this.barFg.position.set(Math.round(game.system.width / 2 - (barWidth / 2)), Math.round(game.system.height / 2 - (barHeight / 2)));
        this.barFg.scale.x = this.percent / 100;
        this.stage.addChild(this.barFg);
    },

    /**
        Set callback function or scene name for loader.
        @method onComplete
        @param {Function|String} callback
    **/
    onComplete: function(callback) {
        if (typeof callback === 'string') this._dynamic = false;
        this._callback = callback;
        return this;
    },

    /**
        Start loader.
        @method start
    **/
    start: function() {
        this.started = true;

        if (!this._dynamic) {
            if (game.tweenEngine) game.tweenEngine.removeAll();

            this.initStage();

            if (!game.scene) this.loopId = game._setGameLoop(this._run.bind(this), game.system.canvas);
            else game.scene = this;
        }

        this.startTime = Date.now();

        if (this._assetQueue.length > 0) this.loader.load();
        else if (this._audioQueue.length > 0) this._loadAudio();
        else if (this._dynamic) this._ready();
    },

    /**
        Called, when loading failed.
        @method error
        @param {String} err
    **/
    error: function(err) {
        throw err;
    },

    /**
        Called when percent is changed.
        @method onPercentChange
    **/
    onPercentChange: function() {
        if (this.barFg) this.barFg.scale.x = this.percent / 100;
    },

    exit: function() {},
    keydown: function() {},
    keyup: function() {}
});

game.addAttributes('Loader', {
    /**
        Minimum time to show loader (ms).
        @attribute {Number} time
        @default 200
    **/
    time: 200,
    /**
        Loading bar background color.
        @attribute {Number} barBg
        @default 0x515e73
    **/
    barBgColor: 0x515e73,
    /**
        Loading bar color.
        @attribute {Number} barColor
        @default 0xe6e7e8
    **/
    barColor: 0xe6e7e8,
    /**
        Width of the loading bar.
        @attribute {Number} barWidth
        @default 200
    **/
    barWidth: 200,
    /**
        Height of the loading bar.
        @attribute {Number} barHeight
        @default 20
    **/
    barHeight: 20
});

});
