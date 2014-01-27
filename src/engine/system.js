/**
    @module system
    @namespace game
**/
game.module(
    'engine.system',
    '1.0.0'
)
.require(
    'engine.timer'
)
.body(function(){ 'use strict';

/**
    Instance automatically created at {{#crossLink "game.Core"}}{{/crossLink}}
    @class System
    @extends game.Class
**/
game.System = game.Class.extend({
    /**
        Width of the game screen.
        @property {Number} width
    **/
    width: null,
    /**
        Height of the game screen.
        @property {Number} height
    **/
    height: null,
    /**
        Current delta-time.
        @property {Number} delta
    **/
    delta: 0,
    tick: 0,
    gameLoopId: 0,
    newSceneClass: null,
    running: false,
    /**
        Main game timer.
        @property {Timer} timer
    **/
    timer: null,
    /**
        Canvas element.
        @property {HTMLCanvasElement} canvas
    **/
    canvas: null,
    /**
        Id of canvas element.
        @property {String} canvasId
        @default canvas
    **/
    canvasId: 'canvas',
    /**
        Is engine paused.
        @property {Boolean} paused
    **/
    paused: false,
    /**
        Is engine in HiRes mode.
        @property {Boolean} hires
    **/
    hires: false,
    /**
        Is engine in Retina mode.
        @property {Boolean} retina
    **/
    retina: false,

    init: function(width, height, canvasId) {
        if(game.System.hires && window.innerWidth >= width * game.System.hiresFactor && window.innerHeight >= height * game.System.hiresFactor) {
            this.hires = true;
        }
        if(game.System.retina && game.ua.pixelRatio === 2) {
            this.retina = true;
        }
        if(this.hires || this.retina) {
            width *= 2;
            height *= 2;
            game.scale = 2;
        }

        this.width = width;
        this.height = height;
        this.canvasId = canvasId || this.canvasId;
        this.timer = new game.Timer();

        if(!document.getElementById(this.canvasId)) {
            var canvas = document.createElement((navigator.isCocoonJS && game.System.screenCanvas) ? 'screencanvas' : 'canvas');
            canvas.id = this.canvasId;
            document.body.appendChild(canvas);
        }

        if(game.Renderer.canvas) this.renderer = new PIXI.CanvasRenderer(width, height, document.getElementById(this.canvasId), game.Renderer.transparent);
        else this.renderer = new PIXI.autoDetectRenderer(width, height, document.getElementById(this.canvasId), game.Renderer.transparent, game.Renderer.antialias);
        
        this.view = this.renderer.view;
        this.canvas = this.renderer.view;
        this.stage = new PIXI.Stage(width,height);

        document.body.style.margin = 0;

        if(this.retina) {
            this.canvas.style.width = width / 2 + 'px';
            this.canvas.style.height = height / 2 + 'px';
        } else {
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
        }

        if(!navigator.isCocoonJS) {
            var visibilityChange;
            if (typeof document.hidden !== 'undefined') {
                visibilityChange = 'visibilitychange';
            } else if (typeof document.mozHidden !== 'undefined') {
                visibilityChange = 'mozvisibilitychange';
            } else if (typeof document.msHidden !== 'undefined') {
                visibilityChange = 'msvisibilitychange';
            } else if (typeof document.webkitHidden !== 'undefined') {
                visibilityChange = 'webkitvisibilitychange';
            }

            document.addEventListener(visibilityChange, function() {
                var hidden = !!game.getVendorAttribute(document, 'hidden');
                if(hidden && game.System.pauseOnHide) game.system.pause();
                if(!hidden && game.System.pauseOnHide) game.system.resume();
            }, false);
        }
        
        if(navigator.isCocoonJS) this.canvas.style.cssText='idtkscale:'+game.System.idtkScale+';';
        
        game.renderer = this.renderer;

        if(!navigator.isCocoonJS) this.initResize();
    },

    /**
        Pause game engine.
        @method pause
    **/
    pause: function() {
        if(this.paused) return;
        this.paused = true;
        if(game.scene) game.scene.pause();
    },

    /**
        Resume paused game engine.
        @method resume
    **/
    resume: function() {
        if(!this.paused) return;
        this.paused = false;
        if(game.scene) game.scene.resume();
    },

    /**
        Change current scene.
        @method setScene
        @param  {Class} sceneClass
    **/
    setScene: function(sceneClass) {
        if(this.running) this.newSceneClass = sceneClass;
        else this.setSceneNow(sceneClass);
    },
    
    setSceneNow: function(SceneClass) {
        game.scene = new (SceneClass)();
        this.startRunLoop();
    },
    
    startRunLoop: function() {
        if(this.gameLoopId) this.stopRunLoop();
        this.gameLoopId = game.setGameLoop(this.run.bind(this), this.canvas);
        this.running = true;
    },

    stopRunLoop: function() {
        game.clearGameLoop(this.gameLoopId);
        this.running = false;
    },
    
    run: function() {
        if(this.paused) return;

        if(game.debug) game.debug.stats.begin();

        game.Timer.step();
        this.delta = this.tick = this.timer.tick();
        
        game.scene.run();
        
        if(game.debug) game.debug.stats.end();

        if(this.newSceneClass) {
            this.setSceneNow(this.newSceneClass);
            this.newSceneClass = null;
        }
    },

    initResize: function() {
        this.ratio = game.System.orientation === game.System.LANDSCAPE ? this.width / this.height : this.height / this.width;
        
        this.canvas.style.margin = 'auto';

        if(game.ua.mobile) {
            document.addEventListener('touchstart', function(e) { e.preventDefault(); }, false);

            var div = document.createElement('div');
            div.innerHTML = game.System.rotateImg ? '' : game.System.rotateMsg;
            div.id = 'ig_rotateMsg';
            div.style.position = 'absolute';
            div.style.height = '12px';
            div.style.textAlign = 'center';
            div.style.left = 0;
            div.style.right = 0;
            div.style.top = 0;
            div.style.bottom = 0;
            div.style.margin = 'auto';
            div.style.display = 'none';
            game.System.rotateDiv = div;
            document.body.appendChild(game.System.rotateDiv);

            if(game.System.rotateImg) {
                var img = new Image();
                var me = this;
                img.onload = function(e) {
                    div.image = e.target;
                    div.appendChild(e.target);
                    div.style.height = e.target.height+'px';
                    me.resizeRotateImage();
                };
                img.src = game.System.rotateImg;
                img.style.position = 'relative';
            }
        } else {
            // Desktop center
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = 0;
            this.canvas.style.left = 0;
            this.canvas.style.bottom = 0;
            this.canvas.style.right = 0;
            // Desktop resize
            var minWidth = game.System.minWidth === 'auto' ? this.retina ? this.width / 4 : this.width / 2 : game.System.minWidth;
            var minHeight = game.System.minHeight === 'auto' ? this.retina ? this.height / 4 : this.height / 2 : game.System.minHeight;
            var maxWidth = game.System.maxWidth === 'auto' ? this.retina ? this.width / 2 : this.width : game.System.maxWidth;
            var maxHeight = game.System.maxHeight === 'auto' ? this.retina ? this.height / 2 : this.height : game.System.maxHeight;
            if(game.System.minWidth) this.canvas.style.minWidth = minWidth + 'px';
            if(game.System.minHeight) this.canvas.style.minHeight = minHeight + 'px';
            if(game.System.maxWidth) this.canvas.style.maxWidth = maxWidth + 'px';
            if(game.System.maxHeight) this.canvas.style.maxHeight = maxHeight + 'px';
        }

        window.onresize = this.onResize.bind(this);
        this.onResize();
    },

    checkOrientation: function() {
        this.orientation = window.innerWidth < window.innerHeight ? game.System.PORTRAIT : game.System.LANDSCAPE;
        game.System.rotateScreen = game.System.orientation !== this.orientation ? true : false;

        this.canvas.style.display = game.System.rotateScreen ? 'none' : 'block';
        game.System.rotateDiv.style.display = game.System.rotateScreen ? 'block' : 'none';

        if(game.System.rotateScreen && game.System.backgroundColor.rotate) document.body.style.backgroundColor = game.System.backgroundColor.rotate;
        if(!game.System.rotateScreen && game.System.backgroundColor.game) document.body.style.backgroundColor = game.System.backgroundColor.game;

        if(game.System.rotateScreen) document.body.style.backgroundImage = game.System.backgroundImage.rotate ? 'url(' + game.System.backgroundImage.rotate + ')' : 'none';
        if(!game.System.rotateScreen) document.body.style.backgroundImage = game.System.backgroundImage.game ? 'url(' + game.System.backgroundImage.game + ')' : 'none';

        if(game.System.rotateScreen && game.system && typeof(game.system.pause) === 'function') game.system.pause();
        if(!game.System.rotateScreen && game.system && typeof(game.system.resume) === 'function') game.system.resume();

        if(game.System.rotateScreen) this.resizeRotateImage();
    },

    resizeRotateImage: function() {
        if(game.System.rotateScreen && game.System.rotateDiv.image) {
            if(window.innerHeight < game.System.rotateDiv.image.height) {
                game.System.rotateDiv.image.style.height = window.innerHeight + 'px';
                game.System.rotateDiv.image.style.width = 'auto';
                game.System.rotateDiv.style.height = window.innerHeight + 'px';
                game.System.rotateDiv.style.bottom = 'auto';
            }
        }
    },

    onResize: function() {
        if(game.ua.mobile) {
            // Mobile resize
            this.checkOrientation();

            if(game.System.orientation === game.System.LANDSCAPE) {
                this.canvas.style.height = window.innerHeight + 'px';
                this.canvas.style.width = window.innerHeight * this.ratio + 'px';
            } else {
                this.canvas.style.width = window.innerWidth + 'px';
                this.canvas.style.height = window.innerWidth * this.ratio + 'px';
            }

            window.scroll(0,1);
        } else {
            // Desktop resize
            if(window.innerWidth < this.width || window.innerHeight < this.height) {
                if(window.innerWidth / this.width < window.innerHeight / this.height) {
                    this.canvas.style.width = '100%';
                    this.canvas.style.height = 'auto';
                }
                else {
                    this.canvas.style.width = 'auto';
                    this.canvas.style.height = '100%';
                }
            }
        }
    }
});

game.System.rotateScreen = false;
game.System.PORTRAIT = 0;
game.System.LANDSCAPE = 1;

/**
    Minimum width for canvas.
    @attribute {Number} minWidth
    @default auto
**/
game.System.minWidth = 'auto';
/**
    Minimum height for canvas.
    @attribute {Number} minHeight
    @default auto
**/
game.System.minHeight = 'auto';
/**
    Maximum width for canvas.
    @attribute {Number} maxWidth
    @default auto
**/
game.System.maxWidth = 'auto';
/**
    Maximum height for canvas.
    @attribute {Number} maxHeight
    @default auto
**/
game.System.maxHeight = 'auto';
/**
    Scaling method for CocoonJS.
    @attribute {ScaleToFill|ScaleAspectFit|ScaleAspectFill} idtkScale
    @default ScaleAspectFit
**/
game.System.idtkScale = 'ScaleAspectFit';
/**
    Use ScreenCanvas on CocoonJS.
    http://support.ludei.com/hc/en-us/articles/201810268-ScreenCanvas
    @attribute {Boolean} screenCanvas
    @default true
**/
game.System.screenCanvas = true;
/**
    Use HiRes mode.
    @attribute {Boolean} hires
    @default false
**/
game.System.hires = false;
/**
    System width/height factor, when to use HiRes mode.
    @attribute {Number} hiresFactor
    @default 1.5
**/
game.System.hiresFactor = 1.5;
/**
    Use Retina mode.
    @attribute {Boolean} retina
    @default false
**/
game.System.retina = false;
/**
    Pause game engine, when page is hidden.
    @attribute {Boolean} pauseOnHide
    @default true
**/
game.System.pauseOnHide = true;
/**
    Mobile orientation for the game.
    @attribute {game.System.LANDSCAPE|game.System.PORTRAIT} orientation
    @default game.System.LANDSCAPE
**/
game.System.orientation = game.System.LANDSCAPE;
game.System.backgroundColor = {
    /**
        Background color for game screen.
        @attribute backgroundColor.game
        @type {String}
    **/
    game: '#000000',
    /**
        Background color for rotate screen.
        @attribute backgroundColor.rotate
        @type {String}
    **/
    rotate: '#ffffff'
};
game.System.backgroundImage = {
    /**
        Background image for game screen.
        @attribute backgroundImage.game
        @type {URL}
    **/
    game: null,
    /**
        Background image for rotate screen.
        @attribute backgroundImage.rotate
        @type {URL}
    **/
    rotate: null
};
/**
    Rotate message for mobile.
    @attribute {String} rotateMsg
    @default Please rotate your device
**/
game.System.rotateMsg = 'Please rotate your device';
/**
    Rotate image for mobile.
    @attribute {URL} rotateImg
    @default null
**/
game.System.rotateImg = null;

});