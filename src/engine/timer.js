/**
    @module timer
    @namespace game
**/
game.module(
    'engine.timer'
)
.body(function(){ 'use strict';

/**
    Basic timer.
    
    __Example__

        var timer = new game.Timer(2);
        if(timer.delta() >= 0) {
            timer.set(2);
        }
    @class Timer
    @extends game.Class
    @constructor
    @param {Number} seconds
**/
game.Timer = game.Class.extend({
    target: 0,
    base: 0,
    last: 0,
    pausedAt: 0,
    
    init: function(seconds) {
        this.last = game.Timer.time;
        this.set(seconds);
    },
    
    /**
        @method set
        @param {Number} seconds
    **/
    set: function(seconds) {
        if(typeof(seconds) !== 'number') seconds = 0;
        this.target = seconds || 0;
        this.reset();
    },
    
    /**
        @method reset
    **/
    reset: function() {
        this.base = game.Timer.time;
        this.pausedAt = 0;
    },
    
    /**
        Get time since last delta.
        @method delta
    **/
    delta: function() {
        var delta = game.Timer.time - this.last;
        this.last = game.Timer.time;
        return this.pausedAt ? 0 : delta;
    },
    
    /**
        Get time since start.
        @method delta
    **/
    time: function() {
        return (this.pausedAt || game.Timer.time) - this.base - this.target;
    },

    /**
        Pause timer.
        @method pause
    **/
    pause: function() {
        if(!this.pausedAt) this.pausedAt = game.Timer.time;
    },

    /**
        Resume paused timer.
        @method unpause
    **/
    unpause: function() {
        if(this.pausedAt) {
            this.base += game.Timer.time - this.pausedAt;
            this.pausedAt = 0;
        }
    }
});

game.Timer.last = 0;
game.Timer.time = Number.MIN_VALUE;
game.Timer.speedFactor = 1;
game.Timer.maxStep = 0.05;

game.Timer.update = function() {
    var current = Date.now();
    var delta = (current - game.Timer.last) / 1000;
    game.Timer.time += Math.min(delta, game.Timer.maxStep) * game.Timer.speedFactor;
    game.Timer.last = current;
};

});