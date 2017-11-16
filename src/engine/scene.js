/**
    @module scene
**/
game.module(
    'engine.scene'
)
.body(function() {

/**
    @class Scene
**/
game.createClass('Scene', {
    /**
        Background color of scene.
        @property {String} backgroundColor
        @default null
    **/
    backgroundColor: null,
    /**
        @property {Boolean} isMouseDown
        @default false
    **/
    isMouseDown: false,
    /**
        List of objects in scene.
        @property {Array} objects
    **/
    objects: [],
    /**
        Main container for scene.
        @property {Container} stage
    **/
    stage: null,
    /**
        List of timers in scene.
        @property {Array} timers
    **/
    timers: [],
    /**
        List of tweens in scene.
        @property {Array} tweens
    **/
    tweens: [],
    /**
        @property {Object} _backgroundColorRgb
        @private
    **/
    _backgroundColorRgb: null,
    /**
        @property {Number} _mouseDownTime
        @private
    **/
    _mouseDownTime: null,
    /**
        @property {Number} _mouseDownX
        @private
    **/
    _mouseDownX: null,
    /**
        @property {Number} _mouseDownY
        @private
    **/
    _mouseDownY: null,
    /**
        @property {Array} _updateOrder
        @private
    **/
    _updateOrder: [],
    
    staticInit: function() {
        this.backgroundColor = this.backgroundColor || game.Scene.backgroundColor;
        if (!this.backgroundColor && game.device.cocoonCanvasPlus) {
            this.backgroundColor = '#000';
        }

        game.input._reset();

        game.scene = this;
        
        this.stage = new game.Container();
        this.stage.stage = this.stage;

        for (var i = 0; i < game.Scene.updateOrder.length; i++) {
            this._updateOrder.push(game.Scene.updateOrder[i].ucfirst());
        }
    },
    
    /**
        Add object to scene, so it's update function get's called every frame.
        @method addObject
        @param {Object} object
    **/
    addObject: function(object) {
        if (this.objects.indexOf(object) === -1) {
            object._remove = false;
            this.objects.push(object);
        }
    },

    /**
        Called, when mouse or touch is released and no swipe is triggered.
        @method click
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {MouseEvent|TouchEvent} event
    **/
    click: function() {},

    /**
        Called, before scene is changed.
        @method exit
        @param {String} sceneName
        @return {Boolean} Return true to abort exit.
    **/
    exit: function() {},

    /**
        Called, when key is pressed.
        @method keydown
        @param {String} key
        @param {Boolean} shift
        @param {Boolean} ctrl
        @param {Boolean} alt
    **/
    keydown: function() {},
    
    /**
        Called, when key is released.
        @method keyup
        @param {String} key
    **/
    keyup: function() {},

    /**
        Called, when mouse or touch is down.
        @method mousedown
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {MouseEvent|TouchEvent} event
    **/
    mousedown: function() {},

    /**
        Called, when mouse or touch is moved.
        @method mousemove
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {MouseEvent|TouchEvent} event
    **/
    mousemove: function() {},

    /**
        Called, when mouse goes out of canvas.
        @method mouseout
        @param {MouseEvent} event
    **/
    mouseout: function() {},
    
    /**
        Called, when mouse or touch is released.
        @method mouseup
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {MouseEvent|TouchEvent} event
    **/
    mouseup: function() {},

    /**
        Called, when system is resized.
        @method onResize
    **/
    onResize: function() {},
    
    /**
        Remove object from scene.
        @method removeObject
        @param {Object} object
    **/
    removeObject: function(object) {
        object._remove = true;
    },
    
    /**
        Remove timer from scene.
        @method removeTimer
        @param {Timer} timer
        @param {Boolean} [doCallback]
    **/
    removeTimer: function(timer, doCallback) {
        if (!timer) return;
        if (!doCallback) timer.callback = null;
        timer.repeat = false;
        timer.set(0);
    },

    /**
        Remove all timers from scene.
        @method removeTimers
        @param {Boolean} [doCallback]
    **/
    removeTimers: function(doCallback) {
        for (var i = this.timers.length - 1; i >= 0; i--) {
            this.removeTimer(this.timers[i], doCallback);
        }
    },

    /**
        Remove all tweens from scene.
        @method removeTweens
    **/
    removeTweens: function() {
        for (var i = 0; i < this.tweens.length; i++) {
            this.tweens[i]._shouldRemove = true;
        }
    },

    /**
        Callback for swipe.
        @method swipe
        @param {String} direction
    **/
    swipe: function() {},
    
    /**
        This is called every frame.
        @method update
    **/
    update: function() {},

    /**
        @method _exit
        @param {String} sceneName
        @private
    **/
    _exit: function(sceneName) {
        if (game.audio && game.Audio.stopOnSceneChange) {
            game.audio.stopMusic();
            for (var i = 0; i < game.audio.sounds.length; i++) {
                game.audio.sounds[i].stop(true);
            }
        }
        
        var exit = this.exit(sceneName);
        return exit;
    },

    /**
        @method _mousedown
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {MouseEvent|TouchEvent} event
        @private
    **/
    _mousedown: function(x, y, id, event) {
        this.isMouseDown = true;
        this._mouseDownTime = game.Timer.time;
        this._mouseDownX = x;
        this._mouseDownY = y;
        this.mousedown(x, y, id, event);
    },

    /**
        @method _mousemove
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {MouseEvent|TouchEvent} event
        @private
    **/
    _mousemove: function(x, y, id, event) {
        this.mousemove(x, y, id, event);
        if (!this._mouseDownTime) return;
        if (x - this._mouseDownX >= game.Scene.swipeDist) this._swipe('RIGHT');
        else if (x - this._mouseDownX <= -game.Scene.swipeDist) this._swipe('LEFT');
        else if (y - this._mouseDownY >= game.Scene.swipeDist) this._swipe('DOWN');
        else if (y - this._mouseDownY <= -game.Scene.swipeDist) this._swipe('UP');
    },

    /**
        @method _mouseup
        @param {Number} x
        @param {Number} y
        @param {Number} id
        @param {MouseEvent|TouchEvent} event
        @private
    **/
    _mouseup: function(x, y, id, event) {
        this.isMouseDown = false;
        if (this._mouseDownTime) this.click(x, y, id, event);
        this._mouseDownTime = null;
        this.mouseup(x, y, id, event);
    },

    /**
        @method _pause
        @private
    **/
    _pause: function() {
        if (game.audio) game.audio._systemPause();
    },
    
    /**
        @method _resume
        @private
    **/
    _resume: function() {
        if (game.audio) game.audio._systemResume();
    },

    /**
        @method _swipe
        @param {String} dir
        @private
    **/
    _swipe: function(dir) {
        var time = game.Timer.time - this._mouseDownTime;
        this._mouseDownTime = null;
        if (time <= game.Scene.swipeTime || game.Scene.swipeTime === 0) {
            this.swipe(dir);
        }
    },
    
    /**
        @method _update
        @private
    **/
    _update: function() {
        this.update();
        for (var i = 0; i < this._updateOrder.length; i++) {
            this['_update' + this._updateOrder[i]]();
        }
    },

    /**
        @method _updateCollision
        @private
    **/
    _updateCollision: function() {
        if (this.world) this.world._updateCollision();
    },

    /**
        @method _updateObjects
        @private
    **/
    _updateObjects: function() {
        for (var i = this.objects.length - 1; i >= 0; i--) {
            if (typeof this.objects[i].update === 'function' && !this.objects[i]._remove) this.objects[i].update();
            if (this.objects[i]._remove) this.objects.splice(i, 1);
        }
    },
    
    /**
        @method _updatePhysics
        @private
    **/
    _updatePhysics: function() {
        if (this.world) this.world._update();
    },

    /**
        @method _updateRenderer
        @private
    **/
    _updateRenderer: function() {
        game.renderer._render(this.stage);
    },

    /**
        @method _updateTimers
        @private
    **/
    _updateTimers: function() {
        for (var i = this.timers.length - 1; i >= 0; i--) {
            if (this.timers[i].time() === 0) {
                if (typeof this.timers[i].callback === 'function') this.timers[i].callback();
                if (this.timers[i].repeat) this.timers[i].reset();
                else this.timers.splice(i, 1);
            }
        }
    },
    
    /**
        @method _updateTweens
        @private
    **/
    _updateTweens: function() {
        for (var i = this.tweens.length - 1; i >= 0; i--) {
            if (!this.tweens[i]._update()) this.tweens.splice(i, 1);
        }
    }
});

game.addAttributes('Scene', {
    /**
        Default background color.
        @attribute {String} backgroundColor
        @default #000
    **/
    backgroundColor: '#000',
    /**
        Minimum distance to trigger swipe.
        @attribute {Number} swipeDist
        @default 100
    **/
    swipeDist: 100,
    /**
        Maximum time to trigger swipe (ms).
        @attribute {Number} swipeTime
        @default 500
    **/
    swipeTime: 500,
    /**
        Update order for scene.
        @attribute {Array} updateOrder
        @default tweens,physics,timers,objects,renderer
    **/
    updateOrder: [
        'physics',
        'tweens',
        'collision',
        'timers',
        'objects',
        'renderer'
    ]
});

});
