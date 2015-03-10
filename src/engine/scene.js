/**
    @module scene
**/
game.module(
    'engine.scene'
)
.body(function() {
'use strict';

/**
    Game scene.
    @class Scene
    @extends Class
**/
game.createClass('Scene', {
    /**
        @property {Array} _updateOrder
        @private
    **/
    _updateOrder: [],
    /**
        Background color of scene.
        @property {Number} backgroundColor
        @default 0x000000
    **/
    backgroundColor: 0x000000,
    /**
        List of objects in scene.
        @property {Array} objects
    **/
    objects: [],
    /**
        List of timers in scene.
        @property {Array} timers
    **/
    timers: [],
    /**
        List of emitters in scene.
        @property {Array} emitters
    **/
    emitters: [],
    /**
        Main container for scene.
        @property {game.Container} stage
    **/
    stage: null,
    /**
        Minimum distance to trigger swipe.
        @property {Number} swipeDist
        @default 100
    **/
    swipeDist: 100,
    /**
        Maximum time to trigger swipe (ms).
        @property {Number} swipeTime
        @default 500
    **/
    swipeTime: 500,
    
    staticInit: function() {
        if (game.audio && game.Audio.stopOnSceneChange && game.scene) {
            game.audio.stopMusic();
            game.audio.stopSound(false, true);
            game.audio.pausedSounds.length = 0;
            game.audio.playingSounds.length = 0;
        }
        
        game.scene = this;
        
        this.stage = new game.Container();
        this.stage.interactive = true;
        this.stage.mousemove = this.stage.touchmove = this._mousemove.bind(this);
        this.stage.click = this.stage.tap = this.click.bind(this);
        this.stage.mousedown = this.stage.touchstart = this._mousedown.bind(this);
        this.stage.mouseup = this.stage.mouseupoutside = this.stage.touchend = this.stage.touchendoutside = this.mouseup.bind(this);
        this.stage.mouseout = this.mouseout.bind(this);
        this.stage.hitArea = new game.HitRectangle(0, 0, game.system.width, game.system.height);

        this._updateOrder.length = 0;
        for (var i = 0; i < game.Scene.updateOrder.length; i++) {
            this._updateOrder.push(game.Scene.updateOrder[i].ucfirst());
        }
    },

    /**
        @method _mousedown
        @param {Object} event
        @private
    **/
    _mousedown: function(event) {
        event.startTime = Date.now();
        event.swipeX = event.data.global.x;
        event.swipeY = event.data.global.y;
        this.mousedown(event);
    },

    /**
        @method _mousemove
        @param {Object} event
        @private
    **/
    _mousemove: function(event) {
        this.mousemove(event);
        if (!event.startTime) return;
        if (event.data.global.x - event.swipeX >= this.swipeDist) this._swipe(event, 'right');
        else if (event.data.global.x - event.swipeX <= -this.swipeDist) this._swipe(event, 'left');
        else if (event.data.global.y - event.swipeY >= this.swipeDist) this._swipe(event, 'down');
        else if (event.data.global.y - event.swipeY <= -this.swipeDist) this._swipe(event, 'up');
    },

    /**
        @method _swipe
        @param {Object} event
        @param {String} dir
        @private
    **/
    _swipe: function(event, dir) {
        var time = Date.now() - event.startTime;
        event.startTime = null;
        if (time <= this.swipeTime || this.swipeTime === 0) this.swipe(dir);
    },
    
    /**
        @method _run
        @private
    **/
    _run: function() {
        this._update();
        this._render();
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
        @method _updateTweens
        @private
    **/
    _updateTweens: function() {
        if (game.tweenEngine) game.tweenEngine.update();
    },
    
    /**
        @method _updatePhysics
        @private
    **/
    _updatePhysics: function() {
        if (this.world) this.world.update();
    },
    
    /**
        @method _updateTimers
        @private
    **/
    _updateTimers: function() {
        for (var i = this.timers.length - 1; i >= 0; i--) {
            if (this.timers[i].time() >= 0) {
                if (typeof this.timers[i].callback === 'function') this.timers[i].callback();
                if (this.timers[i].repeat) this.timers[i].reset();
                else this.timers.splice(i, 1);
            }
        }
    },
    
    /**
        @method _updateEmitters
        @private
    **/
    _updateEmitters: function() {
        for (var i = this.emitters.length - 1; i >= 0; i--) {
            this.emitters[i].update();
            if (this.emitters[i]._remove) this.emitters.splice(i, 1);
        }
    },
    
    /**
        @method _updateObjects
        @private
    **/
    _updateObjects: function() {
        for (var i = this.objects.length - 1; i >= 0; i--) {
            if (typeof this.objects[i].update === 'function') this.objects[i].update();
            if (this.objects[i]._remove) this.objects.splice(i, 1);
        }
    },
    
    /**
        @method _render
        @private
    **/
    _render: function() {
        game.system.renderer.render(this.stage);
    },
    
    /**
        @method _pause
        @private
    **/
    _pause: function() {
        if (game.audio) game.audio.systemPause();
    },
    
    /**
        @method _resume
        @private
    **/
    _resume: function() {
        if (game.audio) game.audio.systemResume();
    },
    
    /**
        Clear stage.
        @method clear
    **/
    clear: function() {
        for (var i = this.stage.children.length - 1; i >= 0; i--) {
            this.stage.removeChild(this.stage.children[i]);
        }
    },
    
    /**
        Add object to scene, so it's `update()` function get's called every frame.
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
        Remove object from scene.
        @method removeObject
        @param {Object} object
    **/
    removeObject: function(object) {
        object._remove = true;
    },
    
    /**
        Add particle emitter to scene.
        @method addEmitter
        @param {game.Emitter} emitter
    **/
    addEmitter: function(emitter) {
        if (this.emitters.indexOf(emitter) === -1) {
            this.emitters.push(emitter);
        }
    },
    
    /**
        Remove emitter from scene.
        @method removeEmitter
        @param {game.Emitter} emitter
    **/
    removeEmitter: function(emitter) {
        if (emitter) emitter.remove();
    },
    
    /**
        Add timer to scene.
        @method addTimer
        @param {Number} time Time (ms).
        @param {Function} callback Callback function to run, when timer ends.
        @param {Boolean} [repeat]
        @return {game.Timer}
    **/
    addTimer: function(time, callback, repeat) {
        var timer = new game.Timer(time);
        timer.repeat = !!repeat;
        timer.callback = callback;
        this.timers.push(timer);
        return timer;
    },
    
    /**
        Remove timer from scene.
        @method removeTimer
        @param {game.Timer} timer
        @param {Boolean} [doCallback]
    **/
    removeTimer: function(timer, doCallback) {
        if (!timer) return;
        if (!doCallback) timer.callback = null;
        timer.repeat = false;
        timer.set(0);
    },
    
    /**
        Shorthand for adding tween.
        @method addTween
        @param {Object} obj
        @param {Object} props
        @param {Number} time
        @param {Object} [settings]
        @return {game.Tween}
    **/
    addTween: function(obj, props, time, settings) {
        var tween = new game.Tween(obj);
        tween.to(props, time);
        for (var i in settings) {
            tween[i](settings[i]);
        }
        return tween;
    },
    
    /**
        Callback for mouse click and touch tap on the scene stage.
        @method click
        @param {InteractionData} InteractionData
    **/
    click: function() {},
    
    /**
        Callback for mousedown and touchstart on the scene stage.
        @method mousedown
        @param {InteractionData} InteractionData
    **/
    mousedown: function() {},
    
    /**
        Callback for mouseup and touchend on the scene stage.
        @method mouseup
        @param {InteractionData} InteractionData
    **/
    mouseup: function() {},
    
    /**
        Callback for mousemove and touchmove on the scene stage.
        @method mousemove
        @param {InteractionData} InteractionData
    **/
    mousemove: function() {},
    
    /**
        Callback for mouseout.
        @method mouseout
        @param {InteractionData} InteractionData
    **/
    mouseout: function() {},
    
    /**
        Callback for keydown.
        @method keydown
    **/
    keydown: function() {},
    
    /**
        Callback for keyup.
        @method keyup
    **/
    keyup: function() {},
    
    /**
        Callback for swipe.
        @method swipe
        @param {String} direction
    **/
    swipe: function() {},
    
    /**
        This is called, when system is resized.
        @method onResize
    **/
    onResize: function() {},
    
    /**
        Called, before scene is changed.
        @method exit
    **/
    exit: function() {},
    
    /**
        This is called every frame.
        @method update
    **/
    update: function() {}
});

game.addAttributes('Scene', {
    /**
        Update order for scene.
        @attribute {Array} updateOrder
        @default tweens,physics,timers,emitters,objects
    **/
    updateOrder: [
        'tweens',
        'physics',
        'timers',
        'emitters',
        'objects'
    ]
});

});
