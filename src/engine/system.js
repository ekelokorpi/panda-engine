/**
    System.

    @module system
    @namespace game
**/
game.module(
    'engine.system'
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
    gameLoopId: 0,
    newSceneClass: null,
    running: false,

    init: function(width, height, canvasId) {
        if(game.System.hires && window.innerWidth >= width * game.System.hiresFactor && window.innerHeight >= height * game.System.hiresFactor) {
            this.hires = true;
        }
        if(game.System.retina && game.device.pixelRatio === 2) {
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

        if(game.System.canvas) this.renderer = new PIXI.CanvasRenderer(width, height, document.getElementById(this.canvasId), game.System.transparent);
        else this.renderer = new PIXI.autoDetectRenderer(width, height, document.getElementById(this.canvasId), game.System.transparent, game.System.antialias);
        
        this.canvas = this.renderer.view;
        this.stage = new PIXI.Stage(width,height);

        game.normalizeVendorAttribute(this.canvas, 'requestFullscreen');
        game.normalizeVendorAttribute(this.canvas, 'requestFullScreen');
        game.normalizeVendorAttribute(navigator, 'vibrate');

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

        window.addEventListener('devicemotion', function(event) {
            game.accelerometer = game.accel = event.accelerationIncludingGravity;
        }, false);
        
        if(navigator.isCocoonJS) this.canvas.style.cssText='idtkscale:'+game.System.idtkScale+';';
        
        game.renderer = this.renderer;

        if(!navigator.isCocoonJS) this.initResize();
    },

    vibrate: function(time) {
        if(navigator.vibrate) return navigator.vibrate(time);
        return false;
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
        @param  {game.Scene} sceneClass
    **/
    setScene: function(sceneClass) {
        if(this.running) this.newSceneClass = sceneClass;
        else this.setSceneNow(sceneClass);
    },
    
    setSceneNow: function(SceneClass) {
        if(game.TweenEngine) game.TweenEngine.removeAll();
        game.scene = new (SceneClass)();
        if(game.Debug && game.Debug.enabled && !navigator.isCocoonJS) this.debug = new game.Debug();
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

        game.Timer.update();
        this.delta = this.timer.delta() / 1000;
        
        game.scene.run();
        
        if(this.debug) this.debug.update();

        if(this.newSceneClass) {
            this.setSceneNow(this.newSceneClass);
            this.newSceneClass = null;
        }
    },

    initResize: function() {
        this.ratio = game.System.orientation === game.System.LANDSCAPE ? this.width / this.height : this.height / this.width;

        if(game.System.center) this.canvas.style.margin = 'auto';

        if(game.device.mobile) {
            // Mobile position
            if(!game.System.center) {
                this.canvas.style.position = 'absolute';
                this.canvas.style.left = game.System.left + 'px';
                this.canvas.style.top = game.System.top + 'px';
            }

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
            if(game.System.center) {
                this.canvas.style.top = 0;
                this.canvas.style.left = 0;
                this.canvas.style.bottom = 0;
                this.canvas.style.right = 0;
            } else {
                this.canvas.style.left = game.System.left + 'px';
                this.canvas.style.top = game.System.top + 'px';
            }

            // Desktop resize
            if(game.System.resize) {
                var minWidth = game.System.minWidth === 'auto' ? this.retina ? this.width / 4 : this.width / 2 : game.System.minWidth;
                var minHeight = game.System.minHeight === 'auto' ? this.retina ? this.height / 4 : this.height / 2 : game.System.minHeight;
                var maxWidth = game.System.maxWidth === 'auto' ? this.retina ? this.width / 2 : this.width : game.System.maxWidth;
                var maxHeight = game.System.maxHeight === 'auto' ? this.retina ? this.height / 2 : this.height : game.System.maxHeight;
                if(game.System.minWidth) this.canvas.style.minWidth = minWidth + 'px';
                if(game.System.minHeight) this.canvas.style.minHeight = minHeight + 'px';
                if(game.System.maxWidth) this.canvas.style.maxWidth = maxWidth + 'px';
                if(game.System.maxHeight) this.canvas.style.maxHeight = maxHeight + 'px';
            }
        }

        window.onresize = this.onResize.bind(this);
        this.onResize();
    },

    checkOrientation: function() {
        this.orientation = window.innerWidth < window.innerHeight ? game.System.PORTRAIT : game.System.LANDSCAPE;
        if(game.device.android2 && window.innerWidth === 320 && window.innerHeight === 251) {
            // Android 2.3 portrait fix
            this.orientation = game.System.PORTRAIT;
        }
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
        // Mobile orientation
        if(game.device.mobile) this.checkOrientation();

        if(!game.System.resize) return;

        if(game.device.mobile) {
            // Mobile resize
            var width = window.innerWidth;
            var height = window.innerHeight;
            
            // iPad iOS 7 landscape innerHeight bugfix
            if(game.device.iPad && height === 671 && this.orientation === game.System.LANDSCAPE) height = 672;

            if(game.System.orientation === game.System.LANDSCAPE) {
                this.canvas.style.height = height + 'px';
                this.canvas.style.width = height * this.ratio + 'px';
            } else {
                this.canvas.style.width = width + 'px';
                this.canvas.style.height = width * this.ratio + 'px';
            }

            if(!game.device.ejecta) window.scroll(0,1);
        } else {
            // Desktop resize
            if(window.innerWidth === 0) return; // Chrome bug
            if(window.innerWidth < this.width || window.innerHeight < this.height) {
                if(window.innerWidth / this.width < window.innerHeight / this.height) {
                    this.canvas.style.width = window.innerWidth + 'px';
                    this.canvas.style.height = window.innerWidth * (this.height / this.width) + 'px';
                }
                else {
                    this.canvas.style.height = window.innerHeight + 'px';
                    this.canvas.style.width = window.innerHeight * (this.width / this.height) + 'px';
                }
            } else {
                this.canvas.style.width = this.width + 'px';
                this.canvas.style.height = this.height + 'px';
            }
        }
    }
});

game.System.rotateScreen = false;
game.System.PORTRAIT = 0;
game.System.LANDSCAPE = 1;

/**
    Turn canvas centering on/off.
    @attribute {Boolean} center
    @default true
**/
game.System.center = true;
game.System.left = 0;
game.System.top = 0;
/**
    Turn canvas resizing on/off.
    @attribute {Boolean} resize
    @default true
**/
game.System.resize = true;

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
    Canvas width/height factor, when to enable HiRes mode.
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
    @attribute {LANDSCAPE|PORTRAIT} orientation
    @default game.System.PORTRAIT
**/
game.System.orientation = game.System.PORTRAIT;
game.System.backgroundColor = {
    /**
        Background color for game screen on mobile.
        @attribute backgroundColor.game
        @type {String}
    **/
    game: '#000000',
    /**
        Background color for rotate screen on mobile.
        @attribute backgroundColor.rotate
        @type {String}
    **/
    rotate: '#ffffff'
};
game.System.backgroundImage = {
    /**
        Background image for game screen on mobile.
        @attribute backgroundImage.game
        @type {URL}
    **/
    game: null,
    /**
        Background image for rotate screen on mobile.
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

game.System.canvas = true;
game.System.transparent = false;
game.System.antialias = false;

});