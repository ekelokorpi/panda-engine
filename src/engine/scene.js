game.module(
    'engine.scene',
    '1.0.0'
)
.body(function(){ 'use strict';

/**
    @class Scene
**/
game.Scene = game.Class.extend({
    /**
        Background color of scene.
        @property {Number} clearColor
    **/
    clearColor: 0x000000,
    sprites: [],
    timers: [],
    interactive: true,
    
    staticInit: function() {
        for (var i = game.system.stage.children.length - 1; i >= 0; i--) {
            game.system.stage.removeChild(game.system.stage.children[i]);
        }

        game.system.stage.setBackgroundColor(this.clearColor);
        game.system.stage.setInteractive(!!this.interactive);

        if(this.interactive) {
            game.system.stage.mousemove = game.system.stage.touchmove = this.mousemove.bind(this);
            game.system.stage.click = game.system.stage.tap = this.click.bind(this);
            game.system.stage.mousedown = game.system.stage.touchstart = this.mousedown.bind(this);
            game.system.stage.mouseup = game.system.stage.mouseupoutside = game.system.stage.touchend = game.system.stage.touchendoutside = this.mouseup.bind(this);
            game.system.stage.mouseout = this.mouseout.bind(this);
        }
    },
    
    run: function() {
        this.update();
        this.render();
    },
    
    update: function(){
        var i;
        if(this.world) this.world.update();
        for (i = this.timers.length - 1; i >= 0; i--) {
            if(this.timers[i].delta() >= 0) {
                if(typeof(this.timers[i].callback) === 'function') this.timers[i].callback();
                this.timers.erase(this.timers[i]);
            }
        }
        for (i = this.sprites.length - 1; i >= 0; i--) {
            this.sprites[i].update();
        }
    },

    /**
        Add timer to game scene.
        @method addTimer
        @param {Number} time Time in seconds
        @param {Function} callback Callback function to run, when timer ends.
    **/
    addTimer: function(time, callback) {
        var timer = new game.Timer(time);
        timer.callback = callback;
        this.timers.push(timer);
    },
    
    render: function(){
        game.renderer.render(game.system.stage);
    },

    pause: function() {
        game.sound.muteAll();
    },

    unpause: function() {
        game.sound.unmuteAll();
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
});

/**
    Main stage for scene.
    @property {Class} stage
**/
Object.defineProperty(game.Scene.prototype, 'stage', {
    get: function() {
        if(!this._stage) {
            this._stage = new PIXI.DisplayObjectContainer();
            game.system.stage.addChild(this._stage);
        }
        return this._stage;
    }
});

});