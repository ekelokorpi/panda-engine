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
    resources: [],
    
    gameClass: null,
    status: 0,
    done: false,
    
    _unloaded: [],
    _drawStatus: 0,
    _intervalId: 0,
    _loadCallbackBound: null,
    _loaded: 0,

    assets: [],
    audioAssets: [],
    audioUnloaded: [],
    percent: 0,
    startTime: null,
    endTime: null,

    init: function( gameClass, resources, audioResources ) {
        if(this.clearColor) {
            var bg = new game.Graphics();
            bg.beginFill(this.clearColor);
            bg.drawRect(0,0,game.system.width,game.system.height);
            game.system.stage.addChild(bg);
        }

        this.gameClass = gameClass;

        for (var i = 0; i < resources.length; i++) {
            var path = this.getPath(resources[i]);
            this.assets.push(path);
        }

        for (i = 0; i < audioResources.length; i++) {
            this.audioAssets.push(audioResources[i]);
            this.audioUnloaded.push(audioResources[i].path);
        }

        this.loader = new game.AssetLoader(this.assets);
        this.loader.onProgress = this.progress.bind(this);
        this.loader.onComplete = this.complete.bind(this);
        this.loader.onError = this.error.bind(this);

        if(this.assets.length === 0) this.percent = 100;

        this.initStage();

        if(this.assets.length === 0) this.ready();
        else this.startTime = Date.now();
    },

    getPath: function(path) {
        return game.system.retina || game.system.hires ? path.replace(/\.(?=[^.]*$)/, '@2x.') : path;
    },

    start: function() {
        this.loader.load();
        this._intervalId = setInterval( this.render.bind(this), 16 );
    },

    initStage: function() {
        this.text = new game.Text(this.percent+'%',{font:'30px Arial',fill:'#ffffff'});
        this.text.position.x = game.system.width / 2 - this.text.width / 2;
        this.text.position.y = game.system.height/2 - 30/2;
        game.system.stage.addChild(this.text);

        this.symbol = new game.Sprite.fromImage('data:image/png;base64,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');
        this.symbol.anchor.x = this.symbol.anchor.y = 0.5;
        this.symbol.position.x = game.system.width/2;
        this.symbol.position.y = game.system.height/2;
        game.system.stage.addChild(this.symbol);
    },

    loadResource: function( res ) {
        res.load( this._loadCallbackBound );
    },

    _loadCallback: function( path, status ) {
        if( status ) {
            this._unloaded.erase( path );
        }
        else {
            throw( 'Failed to load resource: ' + path );
        }
        
        this.status = 1 - (this._unloaded.length / this.resources.length);
        if( this._unloaded.length === 0 ) { // all done?
            setTimeout( this.end.bind(this), 250 );
        }
    },

    error: function() {
        this.text.setText('ERR');
        this.text.updateTransform();
        this.text.position.x = game.system.width / 2 - this.text.width / 2;
        this.onPercentChange = function() {};
    },

    progress: function() {
        this._loaded++;
        this.status = this._loaded / (this.assets.length + this.audioAssets.length);
        this.percent = Math.round(this._loaded / (this.assets.length + this.audioAssets.length) * 100);
        this.onPercentChange();
    },

    onPercentChange: function() {
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
            this.audioUnloaded.erase(path);
        }
        else {
            if(this.text) this.text.setText('ERR');
            throw( 'Failed to load resource: ' + path );
        }

        if(this.audioUnloaded.length === 0) this.ready();
    },

    draw: function() {
        this.symbol.rotation += 0.2;
    },

    render: function() {
        this.draw();
        game.system.renderer.render(game.system.stage);
    },

    ready: function() {
        var timeout = game.Loader.timeout;
        if(this.startTime) {
            this.endTime = Date.now();
            timeout -= this.endTime - this.startTime;
        }
        if(timeout < 100) timeout = 100;
        setTimeout(this.end.bind(this), timeout);
    },

    end: function() {
        if( this.done ) { return; }
        
        // remove @2x from TextureCache
        for(var i in game.TextureCache) {
            if(i.indexOf('@2x') !== -1) {
                game.TextureCache[i.replace('@2x', '')] = game.TextureCache[i];
                delete game.TextureCache[i];
            }
        }

        this.done = true;
        clearInterval( this._intervalId );
        game.system.setScene( this.gameClass );
    }
});

/**
    Minimum time to show preloader. In milliseconds.
    @attribute {Number} timeout
    @default 500
    @example
        game.Loader.timeout = 1000;
**/
game.Loader.timeout = 500;

});