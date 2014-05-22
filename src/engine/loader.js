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
**/
game.Loader = game.Class.extend({
    /**
        Scene to start, when loader is finished.
        @property {game.Scene} scene
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
        Background color of preloader.
        @property {Number} backgroundColor
        @default 0x000000
    **/
    backgroundColor: 0x000000,
    /**
        List of assets to load.
        @property {Array} assets
    **/
    assets: [],
    /**
        List of sounds to load.
        @property {Array} assets
    **/
    sounds: [],
    /**
        Is loader started.
        @property {Boolean} started
    **/
    started: false,
    
    init: function(scene) {
        this.scene = scene || window[game.System.startScene] || game[game.System.startScene];
        this.stage = game.system.stage;

        for (var i = 0; i < game.resources.length; i++) {
            if (game.TextureCache[game.resources[i]]) continue;
            this.assets.push(this.getPath(game.resources[i]));
        }

        if (game.Audio) {
            for (var name in game.Audio.queue) {
                this.sounds.push(name);
            }
        }

        if (this.assets.length > 0) {
            this.loader = new game.AssetLoader(this.assets, true);
            this.loader.onProgress = this.progress.bind(this);
            this.loader.onComplete = this.loadAudio.bind(this);
            this.loader.onError = this.error.bind(this);
        }

        if (this.assets.length === 0 && this.sounds.length === 0) this.percent = 100;
    },

    initStage: function() {
        if (game.Loader.logo) {
            this.logo = new game.Sprite(game.Texture.fromImage(game.Loader.logo));
            this.logo.anchor.set(0.5, 1.0);
            this.logo.position.set(game.system.width / 2, game.system.height / 2 + this.logo.height / 2);
            this.stage.addChild(this.logo);
        }

        var barBg = new game.Graphics();
        barBg.beginFill(game.Loader.barBg);
        barBg.drawRect(0, 0, game.Loader.barWidth, game.Loader.barHeight);
        barBg.position.set(game.system.width / 2 - (game.Loader.barWidth / 2), game.system.height / 2 - (game.Loader.barHeight / 2));
        if (this.logo) barBg.position.y += this.logo.height / 2 + game.Loader.barHeight + game.Loader.barMargin;
        this.stage.addChild(barBg);

        this.bar = new game.Graphics();
        this.bar.beginFill(game.Loader.barColor);
        this.bar.drawRect(0, 0, game.Loader.barWidth, game.Loader.barHeight);
        this.bar.position.set(game.system.width / 2 - (game.Loader.barWidth / 2), game.system.height / 2 - (game.Loader.barHeight / 2));
        if (this.logo) this.bar.position.y += this.logo.height / 2 + game.Loader.barHeight + game.Loader.barMargin;
        this.bar.scale.x = this.percent / 100;
        this.stage.addChild(this.bar);

        if (game.Tween && game.Loader.logoTween && this.logo) {
            this.logo.rotation = -0.1;

            var tween = new game.Tween(this.logo)
                .to({ rotation: 0.1 }, 500)
                .easing(game.Tween.Easing.Cubic.InOut)
                .repeat()
                .yoyo()
                .start();
        }
    },

    /**
        Start loader.
        @method start
    **/
    start: function() {
        this.started = true;

        if (game.scene) {
            for (var i = this.stage.children.length - 1; i >= 0; i--) {
                this.stage.removeChild(this.stage.children[i]);
            }
            this.stage.setBackgroundColor(this.backgroundColor);

            this.stage.interactive = false; // this is not working, bug?

            this.stage.mousemove = this.stage.touchmove = null;
            this.stage.click = this.stage.tap = null;
            this.stage.mousedown = this.stage.touchstart = null;
            this.stage.mouseup = this.stage.mouseupoutside = this.stage.touchend = this.stage.touchendoutside = null;
            this.stage.mouseout = null;
        }
        if (game.audio) game.audio.stopAll();

        if (typeof this.backgroundColor === 'number') {
            var bg = new game.Graphics();
            bg.beginFill(this.backgroundColor);
            bg.drawRect(0, 0, game.system.width, game.system.height);
            this.stage.addChild(bg);
        }
        
        this.initStage();

        if (this.assets.length > 0) this.loader.load();
        else this.loadAudio();
        
        if (!game.scene) this.loopId = game.setGameLoop(this.run.bind(this), game.system.canvas);
        else game.scene = this;
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
        this.percent = Math.round(this.loaded / (this.assets.length + this.sounds.length) * 100);
        this.onPercentChange();
    },

    /**
        Called when percent is changed.
        @method onPercentChange
    **/
    onPercentChange: function() {
        if (this.bar) this.bar.scale.x = this.percent / 100;
    },

    /**
        Start loading audio.
        @method loadAudio
    **/
    loadAudio: function() {
        for (var i = this.sounds.length - 1; i >= 0; i--) {
            game.audio.load(this.sounds[i], this.progress.bind(this));
        }
    },

    /**
        All files loaded.
        @method ready
    **/
    ready: function() {
        this.setScene();
    },

    /**
        Set scene.
        @method setScene
    **/
    setScene: function() {
        if (game.system.retina || game.system.hires) {
            for (var i in game.TextureCache) {
                if (i.indexOf('@2x') !== -1) {
                    game.TextureCache[i.replace('@2x', '')] = game.TextureCache[i];
                    delete game.TextureCache[i];
                }
            }
        }
        game.resources.length = 0;
        if (game.Audio) game.Audio.resources = {};
        game.system.timer.last = 0;
        game.Timer.time = Number.MIN_VALUE;
        game.clearGameLoop(this.loopId);
        game.system.setScene(this.scene);
    },

    run: function() {
        this.last = game.Timer.time;
        game.Timer.update();
        game.system.delta = (game.Timer.time - this.last) / 1000;

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
        else if (this.loaded === this.assets.length + this.sounds.length) {
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
    Minimum time to show preloader, in milliseconds.
    @attribute {Number} timeout
    @default 500
**/
game.Loader.timeout = 500;

/**
    Background color of the loading bar.
    @attribute {Number} barBg
    @default 0x231f20
**/
game.Loader.barBg = 0x231f20;

/**
    Color of the loading bar.
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
    Margin of the loading bar.
    @attribute {Number} barMargin
    @default 10
**/
game.Loader.barMargin = 10;

/**
    Use tween on loader logo.
    @attribute {Boolean} tween
    @default false
**/
game.Loader.logoTween = false;

/**
    Logo to show in loader.
    @attribute {String} logo
    @default null
**/
game.Loader.logo = null;

});
