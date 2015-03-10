/**
    @module system
**/
game.module(
    'engine.system'
)
.body(function() {
'use strict';

/**
    @class System
    @extends Class
**/
game.createClass('System', {
    /**
        @property {Boolean} _running
        @private
    **/
    _running: false,
    /**
        @property {Boolean} _rotateScreenVisible
    **/
    _rotateScreenVisible: false,
    /**
        @property {game.Scene} _newSceneClass
        @private
    **/
    _newSceneClass: null,
    /**
        @property {Number} _gameLoopId
        @private
    **/
    _gameLoopId: 0,
    /**
        @property {Boolean} _pausedOnHide
        @private
    **/
    _pausedOnHide: false,
    /**
        Name of current scene.
        @property {String} sceneName
    **/
    sceneName: null,
    /**
        Width of the game screen.
        @property {Number} width
    **/
    width: 0,
    /**
        Height of the game screen.
        @property {Number} height
    **/
    height: 0,
    /**
        Current delta time in seconds.
        @property {Number} delta
    **/
    delta: 0,
    /**
        Main game timer.
        @property {game.Timer} timer
    **/
    timer: null,
    /**
        Canvas element.
        @property {HTMLCanvasElement} canvas
    **/
    canvas: null,
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
    /**
        Is WebGL enabled.
        @property {Boolean} webGL
    **/
    webGL: false,
    /**
        Original width.
        @property {Number} originalWidth
    **/
    originalWidth: 0,
    /**
        Original height.
        @property {Number} originalHeight
    **/
    originalHeight: 0,
    /**
        System aspect ratio.
        @property {Number} ratio
    **/
    ratio: 0,
    /**
        Canvas width.
        @property {Number} canvasWidth
    **/
    canvasWidth: 0,
    /**
        Canvas height.
        @property {Number} canvasHeight
    **/
    canvasHeight: 0,

    init: function() {
        this.timer = new game.Timer();
        this.originalWidth = game.System.width;
        this.originalHeight = game.System.height;

        // Calculate game.scale value for HiRes mode
        for (var i = 2; i <= game.System.hires; i *= 2) {
            if (window.innerWidth >= this.originalWidth * i && window.innerHeight >= this.originalHeight * i) {
                this.hires = true;
                game.scale = i;
            }
        }

        // Calculate game.scale value for Retina mode
        if (game.System.retina && game.device.pixelRatio === 2 && game.scale < game.System.hires) {
            this.retina = true;
            game.scale *= 2;
        }

        this.canvasWidth = this.width = this.originalWidth * game.scale;
        this.canvasHeight = this.height = this.originalHeight * game.scale;

        // CocoonJS forces system to fullscreen on WebGL
        if (game.System.webGL && game.device.cocoonJS) {
            this.width = window.innerWidth * game.device.pixelRatio;
            this.height = window.innerHeight * game.device.pixelRatio;
        }

        this.ratio = Math.max(this.width, this.height) / Math.min(this.width, this.height);

        this._initRenderer();

        // Init device motion
        if (game.device.mobile) {
            window.addEventListener('devicemotion', function(event) {
                game.devicemotion = event.accelerationIncludingGravity;
            });
        }

        // Init page visibility
        var visibilityChange;
        if (typeof document.hidden !== 'undefined') {
            visibilityChange = 'visibilitychange';
        }
        else if (typeof document.mozHidden !== 'undefined') {
            visibilityChange = 'mozvisibilitychange';
        }
        else if (typeof document.msHidden !== 'undefined') {
            visibilityChange = 'msvisibilitychange';
        }
        else if (typeof document.webkitHidden !== 'undefined') {
            visibilityChange = 'webkitvisibilitychange';
        }
        document.addEventListener(visibilityChange, function() {
            if (game.System.pauseOnHide) {
                var hidden = !!game._getVendorAttribute(document, 'hidden');
                if (hidden) game.system.pause(true);
                else game.system.resume(true);
            }
        });

        // No need for centering, if resizing
        if (game.System.resize) {
            game.System.center = false;
        }

        document.body.style.margin = 0;

        if (typeof window.onorientationchange !== 'undefined' && !game.device.android) {
            window.onorientationchange = this._onResize.bind(this);
        }
        else {
            window.onresize = this._onResize.bind(this);
        }

        this._onResize();
    },

    /**
        @method _initRenderer
        @private
    **/
    _initRenderer: function() {
        this.canvas = document.getElementById(game.System.canvasId);

        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            if (game.device.cocoonJS) this.canvas.screencanvas = !!game.System.screenCanvas;
            this.canvas.id = game.System.canvasId;
            this.canvas.style.display = 'block';
            document.body.appendChild(this.canvas);
        }
        
        game.PIXI.SCALE_MODES.DEFAULT = game.PIXI.SCALE_MODES[game.System.scaleMode.toUpperCase()] || 0;

        var options = {
            view: this.canvas,
            transparent: game.System.transparent,
            backgroundColor: game.System.backgroundColor
        };

        if (game.System.webGL) {
            options.antialias = game.System.antialias;
            options.preserveDrawingBuffer = game.System.preserveDrawingBuffer;
            this.renderer = game.autoDetectRenderer(this.width, this.height, options);
        }
        else {
            options.clearBeforeRender = game.System.clearBeforeRender;
            this.renderer = new game.CanvasRenderer(this.width, this.height, options);
        }

        this.webGL = !!this.renderer.gl;

        game._normalizeVendorAttribute(this.canvas, 'requestFullscreen');
        game._normalizeVendorAttribute(this.canvas, 'requestFullScreen');
    },

    /**
        @method _onResize
        @private
    **/
    _onResize: function() {
        if (game.device.mobile && game.System.rotateScreen) {
            this._rotateScreenVisible = this._isRotateScreenVisible();

            if (this._rotateScreenVisible) {
                this.canvas.style.display = 'none';
                document.body.className = game.System.rotateScreenClass;
                return;
            }
            else {
                this.canvas.style.display = 'block';
                document.body.className = '';

                // Start main loader, if it's not started yet
                if (game._loader && !game._loader.started) game._loader.start();
            }
        }

        if (game.System.scale) {
            if (window.innerWidth / this.originalWidth < window.innerHeight / this.originalHeight) {
                this.canvasWidth = window.innerWidth;
                this.canvasHeight = ~~(window.innerWidth * (this.originalHeight / this.originalWidth));
            }
            else {
                this.canvasWidth = ~~(window.innerHeight * (this.originalWidth / this.originalHeight));
                this.canvasHeight = window.innerHeight;
            }
        }

        if (game.System.resize) {
            if (!game.System.scale) {
                this.resize(window.innerWidth, window.innerHeight);
                this.canvasWidth = window.innerWidth;
                this.canvasHeight = window.innerHeight;
            }
            else {
                var widthSpace = window.innerWidth - this.canvasWidth;
                var heightSpace = window.innerHeight - this.canvasHeight;

                if (widthSpace > 0) {
                    var ratio = widthSpace / this.canvasWidth;
                    var newWidth = ~~(this.originalWidth * game.scale + this.originalWidth * ratio * game.scale);
                    
                    this.resize(newWidth, this.originalHeight * game.scale);
                    this.canvasWidth += widthSpace;
                }
                else if (heightSpace > 0) {
                    var ratio = heightSpace / this.canvasHeight;
                    var newHeight = ~~(this.originalHeight * game.scale + this.originalHeight * ratio * game.scale);
                    
                    this.resize(this.originalWidth * game.scale, newHeight);
                    this.canvasHeight += heightSpace;
                }
            }
        }

        if (game.System.center) {
            this.canvas.style.position = 'absolute';
            this.canvas.style.left = (window.innerWidth / 2 - this.canvasWidth / 2) + 'px';
            this.canvas.style.top = (window.innerHeight / 2 - this.canvasHeight / 2) + 'px';
        }

        if (game.System.scale || game.System.resize) {
            this.canvas.style.width = this.canvasWidth + 'px';
            this.canvas.style.height = this.canvasHeight + 'px';
        }
    },

    /**
        @method _setSceneNow
        @param {game.Scene} sceneClass
        @param {Boolean} removeAssets
        @private
    **/
    _setSceneNow: function(sceneClass, removeAssets) {
        if (this.paused) this.paused = false;
        if (game.scene) game.scene.exit();
        if (game.tweenEngine) game.tweenEngine.tweens.length = 0;
        if (removeAssets) game.removeAssets();
        game.scene = new (sceneClass)();
        this._newSceneClass = null;
        this._startRunLoop();
    },

    /**
        @method _startRunLoop
        @private
    **/
    _startRunLoop: function() {
        if (this._gameLoopId) this._stopRunLoop();
        this._gameLoopId = game._setGameLoop(this._run.bind(this), this.canvas);
        this._running = true;
    },

    /**
        @method _stopRunLoop
        @private
    **/
    _stopRunLoop: function() {
        game._clearGameLoop(this._gameLoopId);
        this._running = false;
    },

    /**
        @method _run
        @private
    **/
    _run: function() {
        if (this.paused || this._pausedOnHide) return;

        game.Timer.update();
        this.delta = this.timer.delta() / 1000;

        game.scene._run();

        if (this._newSceneClass) this._setSceneNow(this._newSceneClass, this._removeAssets);
    },

    /**
        @method _isRotateScreenVisible
        @private
    **/
    _isRotateScreenVisible: function() {
        if (!game.device.mobile || !game.System.rotateScreen) return false;

        if (this.originalWidth > this.originalHeight && window.innerWidth < window.innerHeight ||
            this.originalHeight > this.originalWidth && window.innerHeight < window.innerWidth) {
            return true;
        }
        return false;
    },

    /**
        Resize system.
        @method resize
        @param {Number} width
        @param {Number} height
    **/
    resize: function(width, height) {
        this.width = this.canvas.width = width;
        this.height = this.canvas.height = height;
        this.ratio = Math.max(this.width, this.height) / Math.min(this.width, this.height);
        this.renderer.resize(width, height);
        if (game.scene) game.scene.onResize();
    },

    /**
        Pause game engine.
        @method pause
    **/
    pause: function(onHide) {
        if (this.paused) return;
        if (onHide) this._pausedOnHide = true;
        else this.paused = true;
        if (game.scene) game.scene._pause();
    },

    /**
        Resume game engine.
        @method resume
    **/
    resume: function(onHide) {
        if (onHide && this.paused) return;
        if (!onHide && !this.paused) return;
        if (onHide) this._pausedOnHide = false;
        else this.paused = false;
        game.Timer.last = Date.now();
        if (game.scene) game.scene._resume();
    },

    /**
        Change current scene.
        @method setScene
        @param {String} sceneClass
        @param {Boolean} removeAssets
    **/
    setScene: function(sceneName, removeAssets) {
        var sceneClass = game['Scene' + sceneName];
        if (!sceneClass) return;
        this.sceneName = sceneName;
        if (this._running && !this.paused) {
            this._newSceneClass = sceneClass;
            this._removeAssets = removeAssets;
        }
        else {
            this._setSceneNow(sceneClass, removeAssets);
        }
    }
});

game.addAttributes('System', {
    /**
        Canvas background color.
        @property {Number} backgroundColor
        @default 0x000000
    **/
    backgroundColor: 0x000000,
    /**
        Position canvas to center of window.
        @attribute {Boolean} center
        @default true
    **/
    center: true,
    /**
        Scale canvas to fit window.
        @attribute {Boolean} scale
        @default true
    **/
    scale: true,
    /**
        Resize canvas to fill window.
        @attribute {Boolean} resize
        @default false
    **/
    resize: false,
    /**
        HiRes mode.
        @attribute {Number} hires
        @default 0
    **/
    hires: 0,
    /**
        Use Retina mode.
        @attribute {Boolean} retina
        @default false
    **/
    retina: false,
    /**
        Pause engine, when page is hidden.
        @attribute {Boolean} pauseOnHide
        @default true
    **/
    pauseOnHide: true,
    /**
        Use rotate screen on mobile.
        @attribute {Boolean} rotateScreen
        @default true
    **/
    rotateScreen: true,
    /**
        Class name for document body, when rotate screen visible.
        @attribute {String} rotateScreenClass
        @default rotate
    **/
    rotateScreenClass: 'rotate',
    /**
        System width.
        @attribute {Number} width
        @default 1280
    **/
    width: 1280,
    /**
        System height.
        @attribute {Number} height
        @default 720
    **/
    height: 720,
    /**
        Enable WebGL renderer.
        @attribute {Boolean} webGL
        @default false
    **/
    webGL: false,
    /**
        Use transparent canvas.
        @attribute {Boolean} transparent
        @default false
    **/
    transparent: false,
    /**
        Use antialias (only on WebGL).
        @attribute {Boolean} antialias
        @default false
    **/
    antialias: false,
    /**
        Name of start scene.
        @attribute {String} startScene
        @default Main
    **/
    startScene: 'Main',
    /**
        Id for canvas element, where game is placed. If none found, it will be created.
        @attribute {String} canvasId
        @default canvas
    **/
    canvasId: 'canvas',
    /**
        Canvas scale mode.
        @attribute {linear|nearest} scaleMode
        @default linear
    **/
    scaleMode: 'linear',
    /**
        Enable ScreenCanvas for CocoonJS.
        http://support.ludei.com/hc/en-us/articles/201810268-ScreenCanvas
        @attribute {Boolean} screenCanvas
        @default true
    **/
    screenCanvas: true,
    /**
        Clear canvas on every frame (Canvas renderer).
        @attribute {Boolean} clearBeforeRender
        @default true
    **/
    clearBeforeRender: true,
    /**
        Enables drawing buffer preservation, enable this if you need to call toDataUrl on the WebGL renderer.
        @attribute {Boolean} preserveDrawingBuffer
        @default false
    **/
    preserveDrawingBuffer: false
});

});
