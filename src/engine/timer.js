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
    @param {Number} [time] Timer's target time (milliseconds)
**/
game.createClass('Timer', {
    /**
        Function to call, when timer's time is reached.
        @property {Function} callback
    **/
    callback: null,
    /**
        Is timer paused.
        @property {Boolean} paused
    **/
    paused: false,
    /**
        Should timer repeat.
        @property {Boolean} repeat
    **/
    repeat: false,
    /**
        Timer's target time.
        @property {Number} target
    **/
    target: 0,
    /**
        @property {Number} _base
        @private
    **/
    _base: 0,
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
    
    init: function(time) {
        this._last = game.Timer.time;
        this.set(time);
    },

    /**
        Clear timer.
        @method clear
    **/
    clear: function() {
        this.callback = null;
        this.repeat = false;
        this.set(0);
    },

    /**
        Get time since last frame.
        @method delta
        @return {Number} delta
    **/
    delta: function() {
        var delta = game.Timer.time - this._last;
        this._last = game.Timer.time;
        return this.paused ? 0 : delta;
    },

    /**
        Pause timer.
        @method pause
    **/
    pause: function() {
        if (this.paused) return;
        this._pauseTime = game.Timer.time;
        this.paused = true;
    },

    /**
        Reset timer.
        @method reset
    **/
    reset: function() {
        this._base = game.Timer.time;
        this._pauseTime = 0;
        this.paused = false;
    },

    /**
        Resume paused timer.
        @method resume
    **/
    resume: function() {
        if (!this.paused) return;
        this._base += game.Timer.time - this._pauseTime;
        this._pauseTime = 0;
        this.paused = false;
    },
    
    /**
        Set target time for timer.
        @method set
        @param {Number} ms
    **/
    set: function(ms) {
        if (typeof ms !== 'number') ms = 0;
        this.target = ms;
        this.reset();
    },

    /**
        Get time left.
        @method time
        @return {Number} time
    **/
    time: function() {
        var time = this._base + this.target - (this._pauseTime || game.Timer.time);
        return time < 0 ? 0 : time;
    }
});

game.addAttributes('Timer', {
    /**
        Main timer's delta (ms).
        @attribute {Number} delta
    **/
    delta: 0,
    /**
        Main timer's minimum fps.
        @attribute {Number} minFPS
        @default 20
    **/
    minFPS: 20,
    /**
        Main timer's speed factor.
        @attribute {Number} speed
        @default 1
    **/
    speed: 1,
    /**
        Current time.
        @attribute {Number} time
    **/
    time: 0,
    /**
        @attribute {Number} _last
        @private
    **/
    _last: 0,
    /**
        @attribute {Number} _lastFrameTime
        @private
    **/
    _lastFrameTime: 0,
    /**
        @attribute {Number} _realDelta
        @private
    **/
    _realDelta: 0,
    /**
        Add timer to scene.
        @method add
        @static
        @param {Number} time Time (ms).
        @param {Function} callback Callback function to run, when timer ends.
        @param {Boolean} [repeat]
        @param {Boolean} [instant]
        @return {Timer}
    **/
    add: function(time, callback, repeat, instant) {
        var timer = new game.Timer(time);
        timer.repeat = !!repeat;
        timer.callback = callback;
        game.scene.timers.push(timer);
        if (instant) callback();
        return timer;
    },
    /**
        Update main timer.
        @method update
        @static
    **/
    update: function() {
        var now = Date.now();
        if (!this._last) this._last = now;
        this._realDelta = now - this._last;
        this.delta = Math.min(this._realDelta, 1000 / this.minFPS) * this.speed;
        this._lastFrameTime = this.time;
        this.time += this.delta;
        this._last = now;
    }
});

});
