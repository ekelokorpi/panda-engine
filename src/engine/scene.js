/**
    Scene manager.

    @module scene
    @namespace game
**/
game.module(
    'engine.scene'
)
.body(function(){ 'use strict';

/**
    Game scene.
    @class Scene
    @extends game.Class
**/
game.Scene = game.Class.extend({
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
        List of tweens in scene.
        @property {Array} tweens
    **/
    tweens: [],
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
    
    staticInit: function() {
        game.scene = this;

        for (var i = game.system.stage.children.length - 1; i >= 0; i--) {
            game.system.stage.removeChild(game.system.stage.children[i]);
        }
        game.system.stage.setBackgroundColor(this.clearColor || this.backgroundColor);

        game.system.stage.mousemove = game.system.stage.touchmove = this.mousemove.bind(this);
        game.system.stage.click = game.system.stage.tap = this.click.bind(this);
        game.system.stage.mousedown = game.system.stage.touchstart = this.mousedown.bind(this);
        game.system.stage.mouseup = game.system.stage.mouseupoutside = game.system.stage.touchend = game.system.stage.touchendoutside = this.mouseup.bind(this);
        game.system.stage.mouseout = this.mouseout.bind(this);

        this.stage = new game.Container();
        game.system.stage.addChild(this.stage);

        if(game.debugDraw) game.debugDraw.reset();
    },
    
    /**
        This is called every frame.
        @method update
    **/
    update: function(){
        var i;
        if(this.world) this.world.update();
        for (i = this.timers.length - 1; i >= 0; i--) {
            if(this.timers[i].time() >= 0) {
                if(typeof(this.timers[i].callback) === 'function') this.timers[i].callback();
                if(this.timers[i].repeat) this.timers[i].reset();
                else this.timers.splice(i, 1);
            }
        }
        for (i = this.emitters.length - 1; i >= 0; i--) {
            this.emitters[i].update();
            if(this.emitters[i]._remove) this.emitters.splice(i, 1);
        }
        if(game.TweenEngine) game.TweenEngine.update();
        for (i = this.objects.length - 1; i >= 0; i--) {
            this.objects[i].update();
            if(this.objects[i]._remove) this.objects.splice(i, 1);
        }
    },

    /**
        Add object to scene, so it's `update()` function get's called every frame.
        @method addObject
        @param {Object} object
    **/
    addObject: function(object) {
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
        emitter._remove = true;
    },

    /**
        Add {{#crossLink "game.Tween"}}{{/crossLink}} to scene.
        @method addTween
        @param {Object} obj
        @param {Object} props
        @param {Number} duration
        @param {Object} [settings]
    **/
    addTween: function(obj, props, duration, settings) {
        var tween = new game.Tween(obj, props, duration, settings);
        this.tweens.push(tween);
        return tween;
    },

    /**
        Get tween for object.
        @method getTween
        @param {Object} obj
    **/
    getTween: function(obj) {
        for (var i = 0; i < this.tweens.length; i++) {
            if(this.tweens[i].object === obj) return this.tweens[i];
        }
        return false;
    },

    /**
        Stop tweens for object.
        @method stopTweens
        @param {Object} [obj]
        @param {Boolean} [doComplete]
    **/
    stopTweens: function(obj, doComplete) {
        for (var i = 0; i < this.tweens.length; i++) {
            if(obj && this.tweens[i].object === obj || !obj) this.tweens[i].stop(doComplete);
        }
    },

    /**
        Pause tweens for object.
        @method pauseTweens
        @param {Object} [obj]
    **/
    pauseTweens: function(obj) {
        for ( var i = 0; i < this.tweens.length; i++ ) {
            if(obj && this.tweens[i].object === obj || !obj) this.tweens[i].pause();
        }
    },

    /**
        Resume tweens for object.
        @method resumeTweens
        @param {Object} [obj]
    **/
    resumeTweens: function (obj) {
        for ( var i = 0; i < this.tweens.length; i++ ) {
            if(obj && this.tweens[i].object === obj || !obj) this.tweens[i].resume();
        }
    },

    /**
        Add timer to game scene.
        @method addTimer
        @param {Number} time Time in seconds
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
        if(!doCallback) timer.callback = null;
        timer.repeat = false;
        timer.set(0);
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

    run: function() {
        this.update();
        if(game.debugDraw) game.debugDraw.update();
        this.render();
    },

    render: function(){
        game.renderer.render(game.system.stage);
    },

    pause: function() {
        game.sound.muteAll();
    },

    resume: function() {
        game.sound.unmuteAll();
    }
});

});