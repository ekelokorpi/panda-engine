/**
    Dynamic loader for assets and audio.
    
    @module loader
    @namespace game
**/
game.module(
    'engine.loader'
)
.body(function(){ 'use strict';

/**
    Loader.
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
    
    init: function(scene) {
        var i;

        if(game.Timer.seconds) game.Loader.timeout /= 1000;

        this.scene = scene || SceneGame;
        this.timer = new game.Timer();
        this.stage = game.system.stage;

        for (i = 0; i < game.resources.length; i++) {
            if(game.TextureCache[game.resources[i]]) continue;
            this.assets.push(game.Loader.getPath(game.resources[i]));
        }

        for(var name in game.Audio.queue) {
            this.sounds.push(name);
        }

        if(this.assets.length > 0) {
            this.loader = new game.AssetLoader(this.assets, true);
            this.loader.onProgress = this.progress.bind(this);
            this.loader.onComplete = this.loadAudio.bind(this);
            this.loader.onError = this.error.bind(this);
        }

        if(this.assets.length === 0 && this.sounds.length === 0) this.percent = 100;
    },

    initStage: function() {
        if(!game.device.ejecta) {
            this.text = new game.Text(this.percent+'%',{font:'30px Arial',fill:'#ffffff'});
            this.text.position.x = game.system.width / 2 - this.text.width / 2;
            this.text.position.y = game.system.height/2 + 80;
            this.stage.addChild(this.text);
        }

        var imageData = 'data:image/png;base64,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';
        if(game.device.ie) imageData += '?' + Date.now();
        this.symbol = new game.Sprite(game.system.width/2 - 8, game.system.height/2 + 70, PIXI.Texture.fromImage(imageData, true), {
            anchor: {x: 0.5, y: 1.0},
            rotation: -0.1
        });
        this.stage.addChild(this.symbol);

        if(game.Tween) {
            var tween = new game.Tween(this.symbol)
                .to({rotation: 0.1}, 500)
                .easing(game.Tween.Easing.Cubic.InOut)
                .repeat(Infinity)
                .yoyo(true);
            tween.start();
        }
    },

    /**
        Start loader.
        @method start
    **/
    start: function() {
        if(game.scene) {
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
        if(game.audio) game.audio.stopAll();

        if(typeof(this.backgroundColor) === 'number') {
            var bg = new game.Graphics();
            bg.beginFill(this.backgroundColor);
            bg.drawRect(0, 0, game.system.width, game.system.height);
            this.stage.addChild(bg);
        }
        
        this.initStage();

        if(this.assets.length > 0) this.loader.load();
        else this.loadAudio();
        
        if(!game.scene) this.loopId = game.setGameLoop(this.run.bind(this), game.system.canvas);
        else game.scene = this;
    },

    /**
        Error loading file.
        @method error
        @param {String} msg
    **/
    error: function(msg) {
        if(this.text) {
            this.text.setText('ERR');
            this.text.updateTransform();
            this.text.position.x = game.system.width / 2 - this.text.width / 2;
            this.text = null;
        }
        if(msg) throw msg;
    },

    /**
        File loaded.
        @method progress
    **/
    progress: function(loader) {
        if(loader && loader.json && !loader.json.frames && !loader.json.bones) game.json[loader.url] = loader.json;
        this.loaded++;
        this.percent = Math.round(this.loaded / (this.assets.length + this.sounds.length) * 100);
        this.onPercentChange();
    },

    /**
        Called when percent is changed.
        @method onPercentChange
    **/
    onPercentChange: function() {
        if(!this.text) return;
        this.text.setText(this.percent+'%');
        this.text.updateTransform();
        this.text.position.x = game.system.width / 2 - this.text.width / 2;
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
        if(game.system.retina || game.system.hires) {
            for(var i in game.TextureCache) {
                if(i.indexOf('@2x') !== -1) {
                    game.TextureCache[i.replace('@2x', '')] = game.TextureCache[i];
                    delete game.TextureCache[i];
                }
            }
        }
        game.resources.length = 0;
        game.Audio.resources = {};
        game.Timer.time = Number.MIN_VALUE;
        game.clearGameLoop(this.loopId);
        game.system.setScene(this.scene);
    },

    run: function() {
        game.Timer.update();
        this.update();
        this.render();
    },

    update: function() {
        if(game.TweenEngine) game.TweenEngine.update();
        if(this.loaded === this.assets.length + this.sounds.length && this.timer.time() >= game.Loader.timeout) {
            this.timer.reset();
            this.timer.pause();
            this.ready();
        }
    },

    render: function() {
        game.system.renderer.render(this.stage);
    }
});

/**
    Used to load correct file when in Retina/HiRes mode.
    @attribute {Function} getPath
    @param {String} path
**/
game.Loader.getPath = function(path) {
    return game.system.retina || game.system.hires ? path.replace(/\.(?=[^.]*$)/, '@2x.') : path;
};

/**
    Minimum time to show preloader, in milliseconds.
    @attribute {Number} timeout
    @default 500
    @example
        game.Loader.timeout = 1000;
**/
game.Loader.timeout = 500;

});