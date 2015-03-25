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
**/
game.createClass('System', {
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
        Canvas width.
        @property {Number} canvasWidth
    **/
    canvasWidth: 0,
    /**
        Canvas height.
        @property {Number} canvasHeight
    **/
    canvasHeight: 0,
    /**
        @property {Boolean} _running
        @private
    **/
    _running: false,
    /**
        @property {Boolean} _rotateScreenVisible
        @default false
        @private
    **/
    _rotateScreenVisible: false,
    /**
        @property {Scene} _newSceneClass
        @private
    **/
    _newSceneClass: null,
    /**
        @property {Number} _runLoopId
        @private
    **/
    _runLoopId: 0,
    /**
        @property {Boolean} _pausedOnHide
        @private
    **/
    _pausedOnHide: false,

    init: function() {
        this.originalWidth = game.System.width;
        this.originalHeight = game.System.height;

        // Get scale value for HiRes
        for (var i = 2; i <= game.System.hires; i *= 2) {
            if (window.innerWidth >= this.originalWidth * i && window.innerHeight >= this.originalHeight * i) {
                this.hires = true;
                game.scale = i;
            }
        }

        // Get scale value for Retina
        if (game.System.retina && game.device.pixelRatio === 2 && game.scale < game.System.hires) {
            this.retina = true;
            game.scale *= 2;
        }

        this.canvasWidth = this.width = this.originalWidth * game.scale;
        this.canvasHeight = this.height = this.originalHeight * game.scale;

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
        if (game.System.resize) game.System.center = false;

        window.addEventListener('resize', this._onWindowResize.bind(this));
        this._onWindowResize();
    },

    /**
        Resize system.
        @method resize
        @param {Number} width
        @param {Number} height
    **/
    resize: function(width, height) {
        if (this.width === width && this.height === height) return;
        this.width = width;
        this.height = height;
        game.renderer._resize(width, height);
        if (game.scene && game.scene.onResize) game.scene.onResize();
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
    },

    /**
        @method _scale
        @param {Number} width
        @param {Number} height
        @private
    **/
    _scale: function(width, height) {
        if (!game.System.scale) return;
        
        if (width / this.originalWidth < height / this.originalHeight) {
            this.canvasWidth = width;
            this.canvasHeight = ~~(width * (this.originalHeight / this.originalWidth));
        }
        else {
            this.canvasWidth = ~~(height * (this.originalWidth / this.originalHeight));
            this.canvasHeight = height;
        }
    },

    /**
        @method _resize
        @param {Number} width
        @param {Number} height
        @private
    **/
    _resize: function(width, height) {
        if (!game.System.resize) return;
        if (!game.System.scale) {
            this.resize(width, height);
            this.canvasWidth = width;
            this.canvasHeight = height;
            return;
        }

        var widthSpace = width - this.canvasWidth;
        var heightSpace = height - this.canvasHeight;

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
        else {
            this.resize(width, height);
        }
    },

    /**
        @method _toggleRotateScreen
        @private
    **/
    _toggleRotateScreen: function() {
        if (!game.device.mobile || !game.System.rotateScreen) return false;

        if (this.originalWidth > this.originalHeight && window.innerWidth < window.innerHeight ||
            this.originalHeight > this.originalWidth && window.innerHeight < window.innerWidth) {
            this._showRotateScreen();
            return true;
        }
        else {
            this._hideRotateScreen();
            return false;
        }
    },

    /**
        @method _showRotateScreen
        @private
    **/
    _showRotateScreen: function() {
        if (this._rotateScreenVisible) return;
        this._rotateScreenVisible = true;
        game.renderer._hide();
        document.body.className = game.System.rotateScreenClass;
    },

    /**
        @method _hideRotateScreen
        @private
    **/
    _hideRotateScreen: function() {
        if (!this._rotateScreenVisible) return;
        this._rotateScreenVisible = false;
        game.renderer._show();
        document.body.className = '';

        // Start main loader, if it's not started yet
        if (game._loader && !game._loader.started) game._loader.start();
    },

    /**
        @method _onWindowResize
        @private
    **/
    _onWindowResize: function() {
        if (this._toggleRotateScreen()) return;

        // Fix this
        // window.innerWidth/Height is wrong on Android Chrome (only on startup)
        if (game.device.android && game.device.chrome) {
            var width = screen.width;
            var height = screen.height;
        }
        else {
            var width = window.innerWidth;
            var height = window.innerHeight;
        }

        this._scale(width, height);
        this._resize(width, height);

        if (game.System.center) {
            game.renderer._position((width - this.canvasWidth) / 2, (height - this.canvasHeight) / 2);
        }

        if (game.System.scale || game.System.resize) {
            game.renderer._size(this.canvasWidth, this.canvasHeight);
        }
    },

    /**
        @method _setSceneNow
        @param {Scene} sceneClass
        @param {Boolean} removeAssets
        @private
    **/
    _setSceneNow: function(sceneClass, removeAssets) {
        if (this.paused) this.paused = false;
        if (game.scene && game.scene.exit) game.scene.exit();
        if (game.tween) game.tween.removeAll();
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
        if (this._runLoopId) this._stopRunLoop();
        this._runLoopId = game._setGameLoop(this._run.bind(this));
        this._running = true;
    },

    /**
        @method _stopRunLoop
        @private
    **/
    _stopRunLoop: function() {
        game._clearGameLoop(this._runLoopId);
        this._running = false;
    },

    /**
        @method _run
        @private
    **/
    _run: function() {
        if (this.paused || this._pausedOnHide) return;

        game.Timer.update();
        this.delta = game.Timer.delta / 1000;

        game.input._update();
        game.scene._update();

        if (this._newSceneClass) this._setSceneNow(this._newSceneClass, this._removeAssets);
    }
});

game.addAttributes('System', {
    /**
        Position canvas to center of window.
        @attribute {Boolean} center
        @default false
    **/
    center: false,
    /**
        Scale canvas to fit window.
        @attribute {Boolean} scale
        @default false
    **/
    scale: false,
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
        @default 800
    **/
    width: 800,
    /**
        System height.
        @attribute {Number} height
        @default 600
    **/
    height: 600,
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
    canvasId: 'canvas'
});

});
