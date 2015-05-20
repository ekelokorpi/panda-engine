/**
    @module timer
**/
game.module(
    'engine.timer'
)
.body(function() {

/**
    @class Timer
    @constructor
    @param {Number} [ms]
**/
game.createClass('Timer', {
    /**
        Timer's target time.
        @property {Number} target
    **/
    target: 0,
    /**
        Timer's base time.
        @property {Number} base
    **/
    base: 0,
    /**
        @property {Number} _last
        @private
    **/
    _last: 0,
    /**
        @property {Number} _pauseTime
        @private
    **/
    _pauseTime: 0,
    
    init: function(ms) {
        this._last = game.Timer.time;
        this.set(ms);
    },
    
    /**
        Set time for timer.
        @method set
        @param {Number} ms
    **/
    set: function(ms) {
        if (typeof ms !== 'number') ms = 0;
        this.target = ms;
        this.reset();
    },
    
    /**
        Reset timer.
        @method reset
    **/
    reset: function() {
        this.base = game.Timer.time;
        this._pauseTime = 0;
    },
    
    /**
        Get time since last delta.
        @method delta
        @return {Number} delta
    **/
    delta: function() {
        var delta = game.Timer.time - this._last;
        this._last = game.Timer.time;
        return this._pauseTime ? 0 : delta;
    },
    
    /**
        Get time since start.
        @method time
        @return {Number} time
    **/
    time: function() {
        var time = (this._pauseTime || game.Timer.time) - this.base - this.target;
        return time;
    },

    /**
        Pause timer.
        @method pause
    **/
    pause: function() {
        if (!this._pauseTime) this._pauseTime = game.Timer.time;
    },

    /**
        Resume paused timer.
        @method resume
    **/
    resume: function() {
        if (this._pauseTime) {
            this.base += game.Timer.time - this._pauseTime;
            this._pauseTime = 0;
        }
    }
});

game.addAttributes('Timer', {
    /**
        Current time.
        @attribute {Number} time
    **/
    time: 0,
    /**
        Main timer's speed factor.
        @attribute {Number} speed
        @default 1
    **/
    speed: 1,
    /**
        Main timer's minimum fps.
        @attribute {Number} minFPS
        @default 20
    **/
    minFPS: 20,
    /**
        Main timer's delta (ms).
        @attribute {Number} delta
    **/
    delta: 0,
    /**
        @attribute {Number} _last
        @private
    **/
    _last: 0,
    /**
        @attribute {Number} _realDelta
        @private
    **/
    _realDelta: 0,
    /**
        Update main timer.
        @attribute {Function} update
    **/
    update: function() {
        var now = Date.now();
        if (!this._last) this._last = now;
        this._realDelta = now - this._last;
        this.delta = Math.min(this._realDelta, 1000 / this.minFPS) * this.speed;
        this.time += this.delta;
        this._last = now;
    }
});

});
