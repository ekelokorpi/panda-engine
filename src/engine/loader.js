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
    @param {game.Scene|Function} param
**/
game.Loader = game.Class.extend({
    /**
        Scene to start, when loader is finished.
        @property {game.Scene} scene
        @default null
    **/
    scene: null,
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
        List of sounds to load.
        @property {Array} soundQueue
    **/
    soundQueue: [],
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
    callback: null,
    
    init: function(callback) {
        if (callback && callback.prototype.init || game.System.startScene) {
            this.scene = callback || game[game.System.startScene] || window[game.System.startScene] || game['Scene' + game.System.startScene] || window['Scene' + game.System.startScene];
            this.dynamic = false;
            game.System.startScene = null;
        }
        else {
            this.callback = callback;
        }

        this.stage = game.system.stage;

        for (var i = 0; i < game.assetQueue.length; i++) {
            if (game.TextureCache[game.assetQueue[i]]) continue;
            this.assetQueue.push(this.getPath(game.assetQueue[i]));
        }
        game.assetQueue.length = 0;

        if (game.Audio.enabled) {
            for (var i = 0; i < game.audioQueue.length; i++) {
                this.soundQueue.push(game.audioQueue[i]);
            }
            game.audioQueue.length = 0;
        }

        if (this.assetQueue.length > 0) {
            this.loader = new game.AssetLoader(this.assetQueue, true);
            this.loader.onProgress = this.progress.bind(this);
            this.loader.onComplete = this.loadAudio.bind(this);
            this.loader.onError = this.error.bind(this);
        }

        if (this.assetQueue.length === 0 && this.soundQueue.length === 0) this.percent = 100;
    },

    initStage: function() {
        if (game.Loader.logo) {
            this.logo = new game.Sprite(game.Texture.fromImage(game.Loader.logo));
            this.logo.anchor.set(0.5, 1.0);
            this.logo.position.set(game.system.width / 2, game.system.height / 2 + this.logo.height / 2);
            this.stage.addChild(this.logo);
        }

        this.barBg = new game.Graphics();
        this.barBg.beginFill(game.Loader.barBg);
        this.barBg.drawRect(0, 0, game.Loader.barWidth, game.Loader.barHeight);
        this.barBg.position.set(game.system.width / 2 - (game.Loader.barWidth / 2), game.system.height / 2 - (game.Loader.barHeight / 2));
        if (this.logo) this.barBg.position.y += this.logo.height / 2 + game.Loader.barHeight + game.Loader.barMargin;
        this.stage.addChild(this.barBg);

        this.barFg = new game.Graphics();
        this.barFg.beginFill(game.Loader.barColor);
        this.barFg.drawRect(0, 0, game.Loader.barWidth + 2, game.Loader.barHeight + 2);
        this.barFg.position.set(game.system.width / 2 - (game.Loader.barWidth / 2) - 1, game.system.height / 2 - (game.Loader.barHeight / 2) - 1);
        if (this.logo) this.barFg.position.y += this.logo.height / 2 + game.Loader.barHeight + game.Loader.barMargin;
        this.barFg.scale.x = this.percent / 100;
        this.stage.addChild(this.barFg);
    },

    onComplete: function(callback) {
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
            if (game.scene) {
                for (var i = this.stage.children.length - 1; i >= 0; i--) {
                    this.stage.removeChild(this.stage.children[i]);
                }
                this.stage.setBackgroundColor(game.Loader.bgColor);

                this.stage.interactive = false; // this is not working, bug?

                this.stage.mousemove = this.stage.touchmove = null;
                this.stage.click = this.stage.tap = null;
                this.stage.mousedown = this.stage.touchstart = null;
                this.stage.mouseup = this.stage.mouseupoutside = this.stage.touchend = this.stage.touchendoutside = null;
                this.stage.mouseout = null;
            }

            if (typeof game.Loader.bgColor === 'number') {
                var bg = new game.Graphics();
                bg.beginFill(game.Loader.bgColor);
                bg.drawRect(0, 0, game.system.width, game.system.height);
                this.stage.addChild(bg);
            }
            
            this.initStage();

            if (!game.scene) this.loopId = game.setGameLoop(this.run.bind(this), game.system.canvas);
            else game.scene = this;
        }

        if (this.assetQueue.length > 0) this.loader.load();
        else this.loadAudio();

        return this;
    },

    /**
        Error loading file.
        @method error
        @param {String} msg
    **/
    error: function(msg) {
        if (msg) throw msg;
    },

    /**
        File loaded.
        @method progress
    **/
    progress: function(loader) {
        if (loader && loader.json && !loader.json.frames && !loader.json.bones) game.json[loader.url] = loader.json;
        this.loaded++;
        this.percent = Math.round(this.loaded / (this.assetQueue.length + this.soundQueue.length) * 100);
        this.onPercentChange();

        if (this.dynamic && this.loaded === (this.assetQueue.length + this.soundQueue.length)) this.ready();
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
        for (var i = this.soundQueue.length - 1; i >= 0; i--) {
            game.audio.load(this.soundQueue[i], this.progress.bind(this));
        }
    },

    /**
        All files loaded.
        @method ready
    **/
    ready: function() {
        if (game.system.retina || game.system.hires) {
            for (var i in game.TextureCache) {
                if (i.indexOf('@2x') !== -1) {
                    game.TextureCache[i.replace('@2x', '')] = game.TextureCache[i];
                    delete game.TextureCache[i];
                }
            }
        }

        game.assetQueue.length = 0;
        game.audioQueue.length = 0;

        if (!this.dynamic) return this.setScene();
        if (typeof this.callback === 'function') this.callback();
    },

    /**
        Set scene.
        @method setScene
    **/
    setScene: function() {
        game.system.timer.last = 0;
        game.Timer.time = Number.MIN_VALUE;
        if (this.loopId) game.clearGameLoop(this.loopId);
        game.system.setScene(this.scene);
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
        if (!this.startTime) this.startTime = Date.now();
        if (game.tweenEngine) game.tweenEngine.update();

        if (this._ready) return;
        if (this.timer) {
            if (this.timer.time() >= 0) {
                this._ready = true;
                this.ready();
            }
        }
        else if (this.loaded === this.assetQueue.length + this.soundQueue.length) {
            // Everything loaded
            var loadTime = Date.now() - this.startTime;
            var waitTime = Math.max(100, game.Loader.timeout - loadTime);
            this.timer = new game.Timer(waitTime);
        }
    },

    render: function() {
        game.system.renderer.render(this.stage);
    },

    getPath: function(path) {
        return game.system.retina || game.system.hires ? path.replace(/\.(?=[^.]*$)/, '@2x.') : path;
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
    @attribute {Number} timeout
    @default 200
**/
game.Loader.timeout = 200;
/**
    Loading bar background color.
    @attribute {Number} barBg
    @default 0x231f20
**/
game.Loader.barBg = 0x231f20;
/**
    Loading bar color.
    @attribute {Number} barColor
    @default 0xe6e7e8
**/
game.Loader.barColor = 0xe6e7e8;
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
    Loader logo dataURI.
    @attribute {String} logo
    @default null
**/
game.Loader.logo = null;

});
