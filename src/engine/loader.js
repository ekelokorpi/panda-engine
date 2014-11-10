/**
    @module loader
    @namespace game
**/
game.module(
    'engine.loader'
)
.body(function() {
'use strict';

/**
    Dynamic loader for assets and audio.
    @class Loader
    @extends game.Class
    @constructor
    @param {Function|String} callback
**/
game.Loader = game.Class.extend({
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
        List of assets to load.
        @property {Array} assetQueue
    **/
    assetQueue: [],
    /**
        List of audios to load.
        @property {Array} audioQueue
    **/
    audioQueue: [],
    /**
        Is loader started.
        @property {Boolean} started
        @default false
    **/
    started: false,
    /**
        Enable dynamic mode.
        @property {Boolean} dynamic
        @default true
    **/
    dynamic: true,
    /**
        Callback function or scene name for loader.
        @property {Function|String} callback
    **/
    callback: null,
    
    init: function(callback) {
        this.onComplete(callback);
        this.stage = game.system.stage;

        for (var i = 0; i < game.assetQueue.length; i++) {
            if (game.TextureCache[game.assetQueue[i]]) continue;
            this.assetQueue.push(this.getPath(game.assetQueue[i]));
        }
        game.assetQueue.length = 0;

        if (game.Audio.enabled) {
            for (var i = 0; i < game.audioQueue.length; i++) {
                this.audioQueue.push(game.audioQueue[i]);
            }
            game.audioQueue.length = 0;
        }

        if (this.assetQueue.length > 0) {
            this.loader = new game.AssetLoader(this.assetQueue, game.Loader.crossorigin);
            this.loader.onProgress = this.progress.bind(this);
            this.loader.onComplete = this.loadAudio.bind(this);
            this.loader.onError = this.error.bind(this);
        }

        if (this.assetQueue.length + this.audioQueue.length === 0) this.percent = 100;
    },

    /**
        Init loader stage, when not using dynamic mode.
        @method initStage
    **/
    initStage: function() {
        var barWidth = game.Loader.barWidth * game.scale;
        var barHeight = game.Loader.barHeight * game.scale;
        var barMargin = game.Loader.barMargin * game.scale;

        if (game.Loader.logo) {
            this.logo = new game.Sprite(game.Texture.fromImage(game.Loader.logo));
            this.logo.anchor.set(0.5, 1.0);
            this.logo.position.x = game.system.width / 2;
            this.logo.position.y = game.system.height / 2;
            this.logo.position.y -= barHeight / 2 + barMargin;
            this.stage.addChild(this.logo);
        }

        this.barBg = new game.Graphics();
        this.barBg.beginFill(game.Loader.barBgColor);
        this.barBg.drawRect(0, 0, barWidth, barHeight);
        this.barBg.position.set(game.system.width / 2 - (barWidth / 2), game.system.height / 2 - (barHeight / 2));
        this.stage.addChild(this.barBg);

        this.barFg = new game.Graphics();
        this.barFg.beginFill(game.Loader.barColor);
        this.barFg.drawRect(0, 0, barWidth + 2, barHeight + 2);
        this.barFg.position.set(game.system.width / 2 - (barWidth / 2) - 1, game.system.height / 2 - (barHeight / 2) - 1);
        this.barFg.scale.x = this.percent / 100;
        this.stage.addChild(this.barFg);
    },

    /**
        Set callback function or scene name for loader.
        @method onComplete
        @param {Function|String} callback
    **/
    onComplete: function(callback) {
        if (typeof callback === 'string' || game.System.startScene) this.dynamic = false;
        this.callback = callback;
        return this;
    },

    /**
        Start loader.
        @method start
    **/
    start: function() {
        this.started = true;

        if (!this.dynamic) {
            for (var i = this.stage.children.length - 1; i >= 0; i--) {
                this.stage.removeChild(this.stage.children[i]);
            }
            this.stage.interactive = false;
            if (game.tweenEngine) game.tweenEngine.removeAll();
        
            this.stage.setBackgroundColor(game.Loader.bgColor);

            this.initStage();

            if (!game.scene) this.loopId = game.setGameLoop(this.run.bind(this), game.system.canvas);
            else game.scene = this;
        }

        this.startTime = Date.now();

        if (this.assetQueue.length > 0) this.loader.load();
        else if (this.audioQueue.length > 0) this.loadAudio();
        else if (this.dynamic) this.ready();
    },

    /**
        Error loading file.
        @method error
        @param {String} error
    **/
    error: function(error) {
        if (error) throw error;
    },

    /**
        File loaded.
        @method progress
    **/
    progress: function(loader) {
        if (loader && loader.json) game.json[loader.url] = loader.json;
        this.loaded++;
        this.percent = Math.round(this.loaded / (this.assetQueue.length + this.audioQueue.length) * 100);
        this.onPercentChange();

        if (this.dynamic && this.loaded === this.assetQueue.length + this.audioQueue.length) this.ready();
    },

    /**
        Called when percent is changed.
        @method onPercentChange
    **/
    onPercentChange: function() {
        if (this.barFg) this.barFg.scale.x = this.percent / 100;
    },

    /**
        Start loading audio.
        @method loadAudio
    **/
    loadAudio: function() {
        for (var i = this.audioQueue.length - 1; i >= 0; i--) {
            game.audio.load(this.audioQueue[i], this.progress.bind(this));
        }
    },

    /**
        All files loaded.
        @method ready
    **/
    ready: function() {
        if (game.system.hires || game.system.retina) {
            for (var i in game.TextureCache) {
                if (i.indexOf('@' + game.scale + 'x') !== -1) {
                    game.TextureCache[i.replace('@' + game.scale + 'x', '')] = game.TextureCache[i];
                    delete game.TextureCache[i];
                }
            }
        }

        if (typeof this.callback === 'function') this.callback();
        else this.setScene();
    },

    /**
        Set scene.
        @method setScene
    **/
    setScene: function() {
        game.system.timer.last = 0;
        game.Timer.time = Number.MIN_VALUE;
        if (this.loopId) game.clearGameLoop(this.loopId);
        if (game.System.startScene) {
            var startScene = game.System.startScene;
            game.System.startScene = null;
            game.system.setScene(startScene);
        }
        else game.system.setScene(this.callback);
    },

    run: function() {
        if (this.loopId) {
            this.last = game.Timer.time;
            game.Timer.update();
            game.system.delta = (game.Timer.time - this.last) / 1000;
        }

        this.update();
        this.render();
    },

    update: function() {
        if (game.tweenEngine) game.tweenEngine.update();

        if (this._ready) return;
        if (this.timeoutTimer) {
            if (this.timeoutTimer.time() >= 0) {
                this._ready = true;
                this.ready();
            }
        }
        else if (this.loaded === this.assetQueue.length + this.audioQueue.length) {
            var loadTime = Date.now() - this.startTime;
            var waitTime = Math.max(0, game.Loader.time - loadTime);
            this.timeoutTimer = new game.Timer(waitTime);
        }
    },

    render: function() {
        game.system.renderer.render(this.stage);
    },

    getPath: function(path) {
        return game.system.retina || game.system.hires ? path.replace(/\.(?=[^.]*$)/, '@' + game.scale + 'x.') : path;
    }
});

/**
    Loader background color.
    @attribute {Number} bgColor
    @default 0x000000
**/
game.Loader.bgColor = 0x000000;
/**
    Minimum time to show loader, in milliseconds.
    @attribute {Number} time
    @default 200
**/
game.Loader.time = 200;
/**
    Loading bar background color.
    @attribute {Number} barBg
    @default 0x231f20
**/
game.Loader.barBgColor = 0x515e73;
/**
    Loading bar color.
    @attribute {Number} barColor
    @default 0xe6e7e8
**/
game.Loader.barColor = 0xb9bec7;
/**
    Width of the loading bar.
    @attribute {Number} barWidth
    @default 200
**/
game.Loader.barWidth = 200;
/**
    Height of the loading bar.
    @attribute {Number} barHeight
    @default 20
**/
game.Loader.barHeight = 20;
/**
    Loading bar margin from logo.
    @attribute {Number} barMargin
    @default 10
**/
game.Loader.barMargin = 10;
/**
    Loader logo url.
    @attribute {String} logo
    @default null
**/
game.Loader.logo = null;
/**
    Threat requests as crossorigin.
    @attribute {Boolean} crossorigin
    @default true
**/
game.Loader.crossorigin = true;

});
