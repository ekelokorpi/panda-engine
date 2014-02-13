/**
    @module loader
    @namespace game
**/
game.module(
    'engine.loader'
)
.body(function(){ 'use strict';

/**
    @class Loader
    @extends game.Class
**/
game.Loader = game.Class.extend({
    /**
        Game scene to start, when loader is finished.
        @property {game.Scene} gameScene
    **/
    gameScene: null,
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
    done: false,
    timerId: 0,
    assets: [],
    audioAssets: [],
    audioUnloaded: 0,
    startTime: null,
    endTime: null,
    tweens: [],

    init: function(gameScene, resources, audioResources) {
        if(this.backgroundColor) {
            var bg = new game.Graphics();
            bg.beginFill(this.backgroundColor);
            bg.drawRect(0, 0, game.system.width, game.system.height);
            game.system.stage.addChild(bg);
        }

        this.gameScene = gameScene;
        this.timer = new game.Timer();

        var i, path;
        for (i = 0; i < resources.length; i++) {
            path = this.getPath(resources[i]);
            this.assets.push(path);
        }

        for (i = 0; i < audioResources.length; i++) {
            this.audioAssets.push(audioResources[i]);
        }
        this.audioUnloaded = this.audioAssets.length;

        if(this.assets.length > 0) {
            this.loader = new game.AssetLoader(this.assets, true);
            this.loader.onProgress = this.progress.bind(this);
            this.loader.onComplete = this.complete.bind(this);
            this.loader.onError = this.error.bind(this);
        }

        if(this.assets.length === 0 && this.audioAssets.length === 0) this.percent = 100;

        this.initStage();

        if(this.assets.length === 0 && this.audioAssets.length === 0) this.ready();
        else this.startTime = Date.now();
    },

    initStage: function() {
        this.text = new game.Text(this.percent+'%',{font:'30px Arial',fill:'#ffffff'});
        this.text.position.x = game.system.width / 2 - this.text.width / 2;
        this.text.position.y = game.system.height/2 + 80;
        game.system.stage.addChild(this.text);

        var imageData = 'data:image/png;base64,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';
        if(game.ua.ie) imageData += '?' + Date.now();
        this.symbol = new game.Sprite(game.system.width/2 - 8, game.system.height/2 + 70, PIXI.Texture.fromImage(imageData, true), {
            anchor: {x: 0.5, y: 1.0},
            rotation: -0.1
        });
        game.system.stage.addChild(this.symbol);

        var tween = new game.Tween(this.symbol, {rotation: 0.1}, 0.5, {
            easing: game.Tween.Easing.Cubic.InOut,
            loop: game.Tween.Loop.Reverse
        });
        this.tweens.push(tween);
        tween.start();
    },

    getPath: function(path) {
        return game.system.retina || game.system.hires ? path.replace(/\.(?=[^.]*$)/, '@2x.') : path;
    },

    start: function() {
        if(this.assets.length > 0) this.loader.load();
        else this.loadAudio();
        this.loopId = game.setGameLoop(this.run.bind(this), game.system.canvas);
    },

    error: function() {
        if(!this.text) return;
        this.text.setText('ERR');
        this.text.updateTransform();
        this.text.position.x = game.system.width / 2 - this.text.width / 2;
        this.onPercentChange = function() {};
    },

    progress: function() {
        this.loaded++;
        this.percent = Math.round(this.loaded / (this.assets.length + this.audioAssets.length) * 100);
        this.onPercentChange();
    },

    onPercentChange: function() {
        if(!this.text) return;
        this.text.setText(this.percent+'%');
        this.text.updateTransform();
        this.text.position.x = game.system.width / 2 - this.text.width / 2;
    },

    complete: function() {
        if(this.audioAssets.length > 0) this.loadAudio();
        else this.ready();
    },

    loadAudio: function() {
        for (var i = this.audioAssets.length - 1; i >= 0; i--) {
            this.audioAssets[i].load(this.audioLoaded.bind(this));
        }
    },

    audioLoaded: function(path, status) {
        this.progress();

        if(status) {
            this.audioUnloaded--;
        }
        else {
            if(this.text) this.text.setText('ERR');
            throw('Failed to load audio: ' + path);
        }

        if(this.audioUnloaded === 0) this.ready();
    },

    run: function() {
        game.Timer.update();
        this.delta = this.timer.delta();
        this.update();
        this.render();
    },

    update: function() {
        for (var i = this.tweens.length - 1; i >= 0; i--) {
            this.tweens[i].update();
            if(this.tweens[i].complete) this.tweens.erase(this.tweens[i]);
        }
    },

    render: function() {
        game.system.renderer.render(game.system.stage);
    },

    ready: function() {
        if(this.done) return;
        this.done = true;

        var timeout = game.Loader.timeout * 1000;
        if(this.startTime) {
            this.endTime = Date.now();
            timeout -= this.endTime - this.startTime;
        }
        if(timeout < 100) timeout = 100;

        if(game.system.retina || game.system.hires) {
            for(var i in game.TextureCache) {
                if(i.indexOf('@2x') !== -1) {
                    game.TextureCache[i.replace('@2x', '')] = game.TextureCache[i];
                    delete game.TextureCache[i];
                }
            }
        }

        setTimeout(this.preEnd.bind(this), timeout);
    },

    preEnd: function() {
        this.end();
    },

    end: function() {
        game.Timer.time = Number.MIN_VALUE;
        game.clearGameLoop(this.loopId);
        game.system.setScene(this.gameScene);
    }
});

/**
    Minimum time to show preloader, in seconds.
    @attribute {Number} timeout
    @default 0.5
    @example
        game.Loader.timeout = 1;
**/
game.Loader.timeout = 0.5;

});