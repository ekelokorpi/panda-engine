/**
    @module scene
    @namespace game
**/
game.module(
    'engine.scene'
)
.body(function() {
'use strict';

/**
    Game scene.
    @class Scene
    @extends game.Class
**/
game.createClass('Scene', {
    /**
        Background color of scene.
        @property {Number} backgroundColor
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
        List of particle emitters in scene.
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
        
        for (var i = game.system.stage.children.length - 1; i >= 0; i--) {
            game.system.stage.removeChild(game.system.stage.children[i]);
        }
        game.system.stage.setBackgroundColor(this.backgroundColor);

        game.system.stage.interactive = true;
        game.system.stage.mousemove = game.system.stage.touchmove = this._mousemove.bind(this);
        game.system.stage.click = game.system.stage.tap = this.click.bind(this);
        game.system.stage.mousedown = game.system.stage.touchstart = this._mousedown.bind(this);
        game.system.stage.mouseup = game.system.stage.mouseupoutside = game.system.stage.touchend = game.system.stage.touchendoutside = this.mouseup.bind(this);
        game.system.stage.mouseout = this.mouseout.bind(this);

        this.stage = new game.Container();
        if (game.system.webGL && game.device.cocoonJS) {
            var rendererRatio = game.renderer.width / game.renderer.height;
            var systemRatio = game.system.width / game.system.height;
            if (rendererRatio < systemRatio) {
                var scale = game.renderer.width / game.system.width;
                this.stage.scale.set(scale, scale);
                this.stage.position.y = game.renderer.height / 2 - game.system.height * scale / 2;
            }
            else {
                var scale = game.renderer.height / game.system.height;
                this.stage.scale.set(scale, scale);
                this.stage.position.x = game.renderer.width / 2 - game.system.width * scale / 2;
            }
        }
        game.system.stage.addChild(this.stage);

        if (game.debugDraw) game.debugDraw.reset();
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
        if (object._remove) object._remove = false;
        this.objects.push(object);
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
        this.emitters.push(emitter);
    },

    /**
        Remove emitter from scene.
        @method removeEmitter
        @param {game.Emitter} emitter
    **/
    removeEmitter: function(emitter) {
        emitter.remove();
    },

    /**
        Add timer to game scene.
        @method addTimer
        @param {Number} time Time in milliseconds
        @param {Function} callback Callback function to run, when timer ends.
        @param {Boolean} repeat
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
        @param {Boolean} doCallback
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
        @param {Object} settings
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
        Callback for mouseout on the scene stage.
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

    _mousedown: function(event) {
        event.startTime = Date.now();
        event.swipeX = event.global.x;
        event.swipeY = event.global.y;
        this.mousedown(event);
    },

    _mousemove: function(event) {
        this.mousemove(event);

        if (!event.startTime) return;

        if (event.global.x - event.swipeX >= this.swipeDist) this._swipe(event, 'right');
        else if (event.global.x - event.swipeX <= -this.swipeDist) this._swipe(event, 'left');
        else if (event.global.y - event.swipeY >= this.swipeDist) this._swipe(event, 'down');
        else if (event.global.y - event.swipeY <= -this.swipeDist) this._swipe(event, 'up');
    },

    _swipe: function(event, dir) {
        var time = Date.now() - event.startTime;
        event.startTime = null;
        if (time <= this.swipeTime || this.swipeTime === 0) this.swipe(dir);
    },

    /**
        Callback for swipe.
        @method swipe
        @param {String} direction
    **/
    swipe: function() {
    },

    run: function() {
        this.update();
        if (game.debugDraw) game.debugDraw.update();
        this.render();
    },

    render: function() {
        game.renderer.render(game.system.stage);
    },

    pause: function() {
        if (game.audio) game.audio.systemPause();
    },

    resume: function() {
        if (game.audio) game.audio.systemResume();
    },

    /**
        Called, when scene is changed.
        @method exit
    **/
    exit: function() {
    },

    /**
        This is called every frame.
        @method update
    **/
    update: function() {
        var i;
        if (game.tweenEngine) game.tweenEngine.update();
        if (this.world) this.world.update();
        for (i = this.timers.length - 1; i >= 0; i--) {
            if (this.timers[i].time() >= 0) {
                if (typeof this.timers[i].callback === 'function') this.timers[i].callback();
                if (this.timers[i].repeat) this.timers[i].reset();
                else this.timers.splice(i, 1);
            }
        }
        for (i = this.emitters.length - 1; i >= 0; i--) {
            this.emitters[i].update();
            if (this.emitters[i]._remove) this.emitters.splice(i, 1);
        }
        for (i = this.objects.length - 1; i >= 0; i--) {
            if (typeof this.objects[i].update === 'function') this.objects[i].update();
            if (this.objects[i]._remove) this.objects.splice(i, 1);
        }
    }
});

});
