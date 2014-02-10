/**
    @module loader
    @namespace game
**/
game.module(
    'engine.loader',
    '1.0.0'
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

        this.loader = new game.AssetLoader(this.assets, true);
        this.loader.onProgress = this.progress.bind(this);
        this.loader.onComplete = this.complete.bind(this);
        this.loader.onError = this.error.bind(this);

        if(this.assets.length === 0 && this.audioAssets.length === 0) this.percent = 100;

        this.initStage();

        if(this.assets.length === 0 && this.audioAssets.length === 0) this.ready();
        else this.startTime = Date.now();
    },

    initStage: function() {
        this.text = new game.Text(this.percent+'%',{font:'30px Arial',fill:'#ffffff'});
        this.text.position.x = game.system.width / 2 - this.text.width / 2;
        this.text.position.y = game.system.height/2 - 30/2;
        game.system.stage.addChild(this.text);

        // TODO add panda logo
        // TODO tinypng
        var imageData = 'data:image/png;base64,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';
        if(game.ua.ie) imageData += '?' + Date.now();
        this.symbol = new game.Sprite(game.system.width/2, game.system.height/2, PIXI.Texture.fromImage(imageData, true), {
            anchor: {x: 0.5, y: 0.5}
        });
        game.system.stage.addChild(this.symbol);
    },

    getPath: function(path) {
        return game.system.retina || game.system.hires ? path.replace(/\.(?=[^.]*$)/, '@2x.') : path;
    },

    start: function() {
        this.loader.load();
        // this.timerId = setInterval(this.run.bind(this), 16);
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
        if(this.symbol) this.symbol.rotation += 10 * this.delta;
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

        // remove @2x from TextureCache
        for(var i in game.TextureCache) {
            if(i.indexOf('@2x') !== -1) {
                game.TextureCache[i.replace('@2x', '')] = game.TextureCache[i];
                delete game.TextureCache[i];
            }
        }

        setTimeout(this.preEnd.bind(this), timeout);
    },

    preEnd: function() {
        this.end();
    },

    end: function() {
        game.Timer.time = Number.MIN_VALUE;
        // clearInterval(this.timerId);
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