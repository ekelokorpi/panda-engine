/**
    @module system
**/
game.module(
    'engine.system'
)
.body(function() {

/**
    System manager. Instance automatically created at `game.system`
    @class System
**/
game.createClass('System', {
    /**
        Canvas height.
        @property {Number} canvasHeight
    **/
    canvasHeight: 0,
    /**
        Canvas width.
        @property {Number} canvasWidth
    **/
    canvasWidth: 0,
    /**
        Time since last frame (seconds), shorthand game.delta
        @property {Number} delta
    **/
    delta: 0,
    /**
        Height of the game canvas (pixels), shorthand game.height
        @property {Number} height
    **/
    height: 0,
    /**
        Is engine in HiRes mode.
        @property {Boolean} hires
    **/
    hires: false,
    /**
        Original height.
        @property {Number} originalHeight
    **/
    originalHeight: 0,
    /**
        Original width.
        @property {Number} originalWidth
    **/
    originalWidth: 0,
    /**
        Is engine paused.
        @property {Boolean} paused
    **/
    paused: false,
    /**
        Current scene (game.scene).
        @property {Scene} scene
    **/
    scene: null,
    /**
        Name of current scene.
        @property {String} sceneName
    **/
    sceneName: null,
    /**
        Width of the game canvas (pixels), shorthand game.width
        @property {Number} width
    **/
    width: 0,
    /**
        @property {String} _newSceneName
        @private
    **/
    _newSceneName: null,
    /**
        @property {Boolean} _pausedOnHide
        @private
    **/
    _pausedOnHide: false,
    /**
        @property {Boolean} _rotateScreenVisible
        @default false
        @private
    **/
    _rotateScreenVisible: false,
    /**
        @property {Number} _runLoopId
        @private
    **/
    _runLoopId: 0,
    /**
        @property {Boolean} _running
        @private
    **/
    _running: false,
    /**
        @property {Number} _windowWidth
        @private
    **/
    _windowWidth: 0,
    /**
        @property {Number} _windowHeight
        @private
    **/
    _windowHeight: 0,

    init: function() {
        this._updateWindowSize();

        game.width = this.width = this.originalWidth = game.System.width;
        game.height = this.height = this.originalHeight = game.System.height;
        game.delta = this.delta;

        var realWidth = this.originalWidth;
        var realHeight = this.originalHeight;
        if (game.System.hidpi) {
            realWidth /= game.device.pixelRatio;
            realHeight /= game.device.pixelRatio;
        }
        
        for (var i = 2; i <= game.System.hires; i += 2) {
            var ratio = game.System.hiresRatio * (i / 2);
            var width = game.System.hiresDeviceSize ? game.device.screen.width : this._windowWidth;
            var height = game.System.hiresDeviceSize ? game.device.screen.height : this._windowHeight;
            if (width >= realWidth * ratio && height >= realHeight * ratio) {
                this.hires = true;
                game.scale = i;
            }
        }

        this.canvasWidth = this.originalWidth * game.scale;
        this.canvasHeight = this.originalHeight * game.scale;

        if (typeof document === 'undefined') return;
        
        document.addEventListener(this._getVisibilityChangeFunction(), this._visibilityChange);

        if (game.System.resize) game.System.center = false;

        this._initRenderer();

        if (game.System.hidpi) {
            this.canvasWidth /= game.device.pixelRatio;
            this.canvasHeight /= game.device.pixelRatio;
        }

        this._onWindowResizeFunc = this._onWindowResize.bind(this);
        if (game.device.WKWebView) window.addEventListener('orientationchange', this._onWindowResizeFunc);
        else window.addEventListener('resize', this._onWindowResizeFunc);
        this._onWindowResize();
    },

    /**
        Request fullscreen mode.
        @method fullscreen
    **/
    fullscreen: function() {
        if (game.renderer.canvas.requestFullscreen) game.renderer.canvas.requestFullscreen();
        else if (game.renderer.canvas.requestFullScreen) game.renderer.canvas.requestFullScreen();
    },

    /**
        Test fullscreen support.
        @method fullscreenSupport
        @return {Boolean} Return true, if browser supports fullscreen mode.
    **/
    fullscreenSupport: function() {
        return !!(game.renderer.canvas.requestFullscreen || game.renderer.canvas.requestFullScreen);
    },

    /**
        Load new scene using default loader.
        @method loadScene
        @param {String} scenenName
    **/
    loadScene: function(sceneName) {
        if (!game.mediaQueue.length) this.setScene(sceneName);
        else this.setScene(game.System.loader, sceneName);
    },

    /**
        Resize system.
        @method resize
        @param {Number} width
        @param {Number} height
    **/
    resize: function(width, height) {
        if (this.width === width && this.height === height) return;
        game.width = this.width = width / game.scale;
        game.height = this.height = height / game.scale;
        game.renderer._resize(width, height);
        if (this.scene && this.scene.onResize) this.scene.onResize();
    },

    /**
        Pause game engine.
        @method pause
        @param {Boolean} onHide
    **/
    pause: function(onHide) {
        if (this.paused) return;
        if (onHide) this._pausedOnHide = true;
        else this.paused = true;
        if (this.scene && this.scene._pause) this.scene._pause();
    },

    /**
        Resume game engine.
        @method resume
        @param {Boolean} onHide
    **/
    resume: function(onHide) {
        if (onHide && this.paused) return;
        if (!onHide && !this.paused) return;
        if (onHide) this._pausedOnHide = false;
        else this.paused = false;
        game.Timer.last = Date.now();
        if (this.scene && this.scene._resume) this.scene._resume();
    },

    /**
        Change current scene. If you don't define sceneName, current scene will be restarted.
        @method setScene
        @param {String} sceneName
        @param {String} [param]
    **/
    setScene: function(sceneName, param) {
        if (!sceneName && this.scene) sceneName = this.scene.constructor._name;
        if (!game[sceneName]) throw 'Scene ' + sceneName + ' not found';
        if (this._running && !this.paused) {
            this._newSceneName = sceneName;
            this._newSceneParam = param;
        }
        else this._setSceneNow(sceneName, param);
    },
    
    /**
        @method _getVisibilityChangeFunction
        @private
    **/
    _getVisibilityChangeFunction: function() {
        if (typeof document.hidden !== 'undefined') {
            return 'visibilitychange';
        }
        else if (typeof document.mozHidden !== 'undefined') {
            return 'mozvisibilitychange';
        }
        else if (typeof document.msHidden !== 'undefined') {
            return 'msvisibilitychange';
        }
        else if (typeof document.webkitHidden !== 'undefined') {
            return 'webkitvisibilitychange';
        }
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
    },

    /**
        @method _initRenderer
        @private
    **/
    _initRenderer: function() {
        game.renderer = new game.Renderer(this.canvasWidth, this.canvasHeight);
    },

    /**
        @method _onWindowResize
        @private
    **/
    _onWindowResize: function() {
        this._updateWindowSize();
        if (this._toggleRotateScreen()) return;

        var scalePercent = game.System.scalePercent / 100;
        this._scale(this._windowWidth * scalePercent, this._windowHeight * scalePercent);
        this._resize(this._windowWidth, this._windowHeight);

        if (game.System.center) {
            game.renderer._position((this._windowWidth - this.canvasWidth) / 2, (this._windowHeight - this.canvasHeight) / 2);
        }

        if (game.System.scale || game.System.resize || game.System.hidpi && game.device.pixelRatio > 1) {
            game.renderer._size(this.canvasWidth, this.canvasHeight);
        }

        if (game.isStarted && !game.scene) game.onStart();
    },
    
    /**
        Remove all event listeners.
        @method _remove
        @private
    **/
    _remove: function() {
        document.removeEventListener(this._getVisibilityChangeFunction(), this._visibilityChange);
        if (game.device.WKWebView) window.removeEventListener('orientationchange', this._onWindowResizeFunc);
        else window.removeEventListener('resize', this._onWindowResizeFunc);
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
    },

    /**
        @method _run
        @private
    **/
    _run: function() {
        if (this.paused || this._pausedOnHide) return;

        game.Timer.update();
        game.delta = this.delta = game.Timer.delta / 1000;

        if (game.input) game.input._update();
        this.scene._update();

        if (this._newSceneName) this._setSceneNow(this._newSceneName, this._newSceneParam);
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

        if (game.System.scaleMax > 0) {
            var maxWidth = this.originalWidth * (game.System.scaleMax / 100);
            var maxHeight = this.originalHeight * (game.System.scaleMax / 100);
            if (this.canvasWidth > maxWidth) this.canvasWidth = maxWidth;
            if (this.canvasHeight > maxHeight) this.canvasHeight = maxHeight;
        }
    },

    /**
        @method _setSceneNow
        @param {String} sceneName
        @param {*} [param]
        @private
    **/
    _setSceneNow: function(sceneName, param) {
        this.sceneName = sceneName;
        this._newSceneName = null;
        if (this.scene && this.scene._exit(sceneName)) return;
        if (this.paused) this.paused = false;
        game.TilingSprite.clearCache();
        game.Sprite._clearTintedTextures();
        this.scene = new game[sceneName](param);
        this._startRunLoop();
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
        @method _startRunLoop
        @private
    **/
    _startRunLoop: function() {
        if (!this.scene) return;
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
        @method _toggleRotateScreen
        @private
    **/
    _toggleRotateScreen: function() {
        if (!game.device.mobile || !game.System.rotateScreen) return false;

        if (this.originalWidth > this.originalHeight && this._windowWidth < this._windowHeight ||
            this.originalHeight > this.originalWidth && this._windowHeight < this._windowWidth) {
            this._showRotateScreen();
            return true;
        }
        
        this._hideRotateScreen();
        return false;
    },

    /**
        @method _updateWindowSize
        @private
    **/
    _updateWindowSize: function() {
        if (typeof document === 'undefined') return;
        this._windowWidth = game.device.WKWebView ? document.documentElement.clientWidth : window.innerWidth;
        this._windowHeight = game.device.WKWebView ? document.documentElement.clientHeight : window.innerHeight;
        if (game.device.crosswalk && this._windowWidth === 0) {
            this._windowWidth = window.screen.width;
            this._windowHeight = window.screen.height;
        }
        if (Math.abs(window.orientation) === 90 && game.device.iPhone && game.device.safari) {
            // Fix iPhone Safari landscape fullscreen
            this._windowHeight++;
        }
    },
    
    /**
        @method _visibilityChange
        @private
    **/
    _visibilityChange: function() {
        if (game.System.pauseOnHide) {
            var hidden = !!game._getVendorAttribute(document, 'hidden');
            if (hidden) game.system.pause(true);
            else game.system.resume(true);
        }
    }
});

game.addAttributes('System', {
    /**
        Id for canvas element, where game is placed. If none found, it will be created.
        @attribute {String} canvasId
        @default canvas
    **/
    canvasId: 'canvas',
    /**
        Position canvas to center of window.
        @attribute {Boolean} center
        @default true
    **/
    center: true,
    /**
        Set custom frame rate for game loop.
        @attribute {Number} frameRate
        @default null
    **/
    frameRate: null,
    /**
        System height.
        @attribute {Number} height
        @default 768
    **/
    height: 768,
    /**
        Scale canvas for HiDPI screens.
        @attribute {Boolean} hidpi
        @default true
    **/
    hidpi: true,
    /**
        HiRes mode multiplier.
        @attribute {Number} hires
        @default 0
    **/
    hires: 0,
    /**
        Use device size instead of window size on HiRes mode.
        @attribute {Boolean} hiresDeviceSize
        @default false
    **/
    hiresDeviceSize: false,
    /**
        Ratio value, when HiRes mode is used.
        @attribute {Number} hiresRatio
        @default 2
    **/
    hiresRatio: 2,
    /**
        Default loader class.
        @attribute {String} loader
        @default Loader
    **/
    loader: 'Loader',
    /**
        Pause engine, when page is hidden.
        @attribute {Boolean} pauseOnHide
        @default true
    **/
    pauseOnHide: true,
    /**
        Resize canvas to fill window.
        @attribute {Boolean} resize
        @default false
    **/
    resize: false,
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
        Scale canvas to fit window.
        @attribute {Boolean} scale
        @default true
    **/
    scale: true,
    /**
        Maximum percent of scaling (0 = disabled).
        @attribute {Number} scaleMax
        @default 0
    **/
    scaleMax: 0,
    /**
        @attribute {Number} scalePercent
        @default 100
    **/
    scalePercent: 100,
    /**
        Name of start scene.
        @attribute {String} startScene
        @default Main
    **/
    startScene: 'Main',
    /**
        System width.
        @attribute {Number} width
        @default 1024
    **/
    width: 1024
});

});
