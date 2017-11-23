/**
    @module tween
**/
game.module(
    'engine.tween'
)
.body(function() {

/**
    @class Tween
    @constructor
    @param {Object} object
**/
game.createClass('Tween', {
    /**
        List of chainged tweens.
        @property {Array} chainedTweens
    **/
    chainedTweens: [],
    /**
        Current time of tween.
        @property {Number} currentTime
    **/
    currentTime: 0,
    /**
        Is delay repeating.
        @property {Boolean} delayRepeat
        @default false
    **/
    delayRepeat: false,
    /**
        Tween's delay time.
        @property {Number} delayTime
        @default 0
    **/
    delayTime: 0,
    /**
        Tween duration.
        @property {Number} duration
        @default 1000
    **/
    duration: 1000,
    /**
        Tween's easing function.
        @property {Function} easingFunction
    **/
    easingFunction: null,
    /**
        Tween's interpolation function.
        @property {Function} interpolationFunction
    **/
    interpolationFunction: null,
    /**
        Tween's target object.
        @property {Object} object
    **/
    object: null,
    /**
        Tween's complete callback.
        @property {Function} onCompleteCallback
    **/
    onCompleteCallback: null,
    /**
        Tween's repeat callback.
        @property {Function} onRepeatCallback
    **/
    onRepeatCallback: null,
    /**
        Tween's start callback.
        @property {Function} onStartCallback
    **/
    onStartCallback: null,
    /**
        Tween's update callback.
        @property {Function} onUpdateCallback
    **/
    onUpdateCallback: null,
    /**
        Is tween paused.
        @property {Boolean} paused
    **/
    paused: false,
    /**
        Is tween playing.
        @property {Boolean} playing
    **/
    playing: false,
    /**
        Tween's repeat count.
        @property {Number} repeatCount
    **/
    repeatCount: 0,
    /**
        Is tween currently reversed.
        @property {Boolean} reversed
    **/
    reversed: false,
    /**
        Is yoyo enabled.
        @property {Boolean} yoyoEnabled
    **/
    yoyoEnabled: false,
    /**
        @property {Boolean} _onStartCallbackFired
        @private
    **/
    _onStartCallbackFired: false,
    /**
        @property {Number} _originalStartTime
        @private
    **/
    _originalStartTime: null,
    /**
        @property {Number} _repeats
        @private
    **/
    _repeats: 0,
    /**
        @property {Boolean} _shouldRemove
        @private
    **/
    _shouldRemove: false,
    /**
        @property {Number} _startTime
        @private
    **/
    _startTime: null,
    /**
        @property {Object} _valuesEnd
        @private
    **/
    _valuesEnd: null,
    /**
        @property {Object} _valuesStart
        @private
    **/
    _valuesStart: {},
    /**
        @property {Object} _valuesStartRepeat
        @private
    **/
    _valuesStartRepeat: {},

    staticInit: function(object) {
        if (typeof object !== 'object') throw 'Tween parameter must be object';
        this.object = object;

        this.easingFunction = game.Tween.Easing.Linear.None;
        this.interpolationFunction = game.Tween.Interpolation.Linear;

        for (var field in object) {
            this._valuesStart[field] = parseFloat(object[field], 10);
        }
    },

    /**
        Chain tween.
        @method chain
        @param {Tween} tween
        @chainable
    **/
    chain: function() {
        this.chainedTweens = arguments;
        return this;
    },

    /**
        Set delay for tween.
        @method delay
        @param {Number} time
        @param {Boolean} repeat
        @chainable
    **/
    delay: function(time, repeat) {
        this.delayTime = time;
        this.delayRepeat = !!repeat;
        return this;
    },

    /**
        Set easing for tween.
        @method easing
        @param {String} easing
        @chainable
    **/
    easing: function(easing) {
        if (typeof easing === 'string') {
            easing = easing.split('.');
            this.easingFunction = game.Tween.Easing[easing[0]][easing[1]];
        }
        else {
            this.easingFunction = easing;
        }
        return this;
    },

    /**
        Set interpolation for tween.
        @method interpolation
        @param {Function} interpolation
        @chainable
    **/
    interpolation: function(interpolation) {
        this.interpolationFunction = interpolation;
        return this;
    },

    /**
        Set onComplete callback for tween.
        @method onComplete
        @param {Function} callback
        @chainable
    **/
    onComplete: function(callback) {
        this.onCompleteCallback = callback;
        return this;
    },
    
    /**
        Set onRepeat callback for tween.
        @method onRepeat
        @param {Function} callback
        @chainable
    **/
    onRepeat: function(callback) {
        this.onRepeatCallback = callback;
        return this;
    },

    /**
        Set onStart callback for tween.
        @method onStart
        @param {Function} callback
        @chainable
    **/
    onStart: function(callback) {
        this.onStartCallback = callback;
        return this;
    },

    /**
        Set onUpdate callback for tween.
        @method onUpdate
        @param {Function} callback
        @chainable
    **/
    onUpdate: function(callback) {
        this.onUpdateCallback = callback;
        return this;
    },

    /**
        Pause tween.
        @method pause
    **/
    pause: function() {
        this.paused = true;
    },

    /**
        Set repeat for tween.
        @method repeat
        @param {Number} times
        @chainable
    **/
    repeat: function(times) {
        if (typeof times === 'undefined') times = Infinity;
        this.repeatCount = times;
        return this;
    },

    /**
        Resume tween.
        @method resume
    **/
    resume: function() {
        this.paused = false;
    },

    /**
        Start tween.
        @method start
        @chainable
    **/
    start: function() {
        if (game.scene) game.scene.tweens.push(this);
        this.currentTime = 0;
        this.playing = true;
        this._onStartCallbackFired = false;
        this._startTime = this.delayTime;
        this._originalStartTime = this._startTime;
        for (var property in this._valuesEnd) {
            // check ifan Array was provided as property value
            if (this._valuesEnd[property] instanceof Array) {
                if (this._valuesEnd[property].length === 0) {
                    continue;
                }
                // create a local copy of the Array with the start value at the front
                this._valuesEnd[property] = [this.object[property]].concat(this._valuesEnd[property]);
            }
            this._valuesStart[property] = this.object[property];
            if ((this._valuesStart[property] instanceof Array) === false) {
                this._valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
            }
            this._valuesStartRepeat[property] = this._valuesStart[property] || 0;
        }
        return this;
    },

    /**
        Stop tween.
        @method stop
        @chainable
    **/
    stop: function() {
        if (!this.playing) return this;
        this.playing = false;
        this._shouldRemove = true;
        this._stopChainedTweens();
        return this;
    },

    /**
        Set tween properties
        @method to
        @param {Object} properties
        @param {Number} duration
        @chainable
    **/
    to: function(properties, duration) {
        this.duration = duration || this.duration;
        this._valuesEnd = properties;
        return this;
    },

    /**
        Set tween to yoyo.
        @method yoyo
        @param {Boolean} enabled
        @chainable
    **/
    yoyo: function(enabled) {
        if (typeof enabled === 'undefined') enabled = true;
        this.yoyoEnabled = enabled;
        return this;
    },

    /**
        @method _stopChainedTweens
        @private
    **/
    _stopChainedTweens: function() {
        for (var i = 0, numChainedTweens = this.chainedTweens.length; i < numChainedTweens; i++) {
            this.chainedTweens[i].stop();
        }
    },

    /**
        @method _update
        @private
    **/
    _update: function() {
        if (this._shouldRemove) return false;
        if (this.paused) return true;

        this.currentTime += game.delta * 1000;

        if (this.currentTime < this._startTime) return true;
        
        if (this._onStartCallbackFired === false) {
            if (this.onStartCallback !== null) {
                this.onStartCallback.call(this.object);
            }
            this._onStartCallbackFired = true;
        }
        
        var elapsed = (this.currentTime - this._startTime) / this.duration;
        elapsed = elapsed > 1 ? 1 : elapsed;
        var value = this.easingFunction(elapsed);
        var property;
        for (property in this._valuesEnd) {
            var start = this._valuesStart[property] || 0;
            var end = this._valuesEnd[property];
            if (end instanceof Array) {
                this.object[property] = this.interpolationFunction(end, value);
            }
            else {
                // Parses relative end values with start as base (e.g.: +10, -3)
                if (typeof end === 'string') {
                    end = start + parseFloat(end, 10);
                }
                // Protect against non numeric properties
                if (typeof end === 'number') {
                    this.object[property] = start + (end - start) * value;
                }
            }
        }
        if (this.onUpdateCallback !== null) {
            this.onUpdateCallback.call(this.object, value);
        }
        if (elapsed === 1) {
            if (this.repeatCount > 0) {
                if (isFinite(this.repeatCount)) {
                    this.repeatCount--;
                }
                this._repeats += 1;
                // Reassign starting values, restart by making startTime = now
                for (property in this._valuesStartRepeat) {
                    if (typeof this._valuesEnd[property] === 'string') {
                        this._valuesStartRepeat[property] = this._valuesStartRepeat[property] + parseFloat(this._valuesEnd[property], 10);
                    }
                    if (this.yoyoEnabled) {
                        var tmp = this._valuesStartRepeat[property];
                        this._valuesStartRepeat[property] = this._valuesEnd[property];
                        this._valuesEnd[property] = tmp;
                        this.reversed = !this.reversed;
                    }
                    this._valuesStart[property] = this._valuesStartRepeat[property];
                }
                if (!this.delayRepeat) this.delayTime = 0;
                this._startTime = this._originalStartTime + this._repeats * (this.duration + this.delayTime);
                if (this.onRepeatCallback !== null) {
                    this.onRepeatCallback.call(this.object);
                }
                return true;
            }
            else {
                this.playing = false;
                if (typeof this.onCompleteCallback === 'function') {
                    this.onCompleteCallback.call(this.object);
                }
                for (var i = 0, numChainedTweens = this.chainedTweens.length; i < numChainedTweens; i++) {
                    this.chainedTweens[i].start();
                }
                return false;
            }
        }
        return true;
    }
});

game.addAttributes('Tween', {
    /**
        Shorthand for adding tween.
        @method add
        @static
        @param {Object} obj
        @param {Object} props
        @param {Number} time
        @param {Object} [settings]
        @return {Tween}
    **/
    add: function(obj, props, time, settings) {
        var tween = new game.Tween(obj);
        tween.to(props, time);
        for (var i in settings) {
            if (!tween[i]) throw 'Invalid Tween setting: ' + i;
            tween[i](settings[i]);
        }
        return tween;
    },

    /**
        @attribute {Object} Easing
        @example
            Linear
            Quadratic
            Cubic
    **/
    Easing: {
        Linear: {
            None: function(k) {
                return k;
            }
        },

        Quadratic: {
            In: function(k) {
                return k * k;
            },

            Out: function(k) {
                return k * (2 - k);
            },

            InOut: function(k) {
                if ((k *= 2) < 1) return 0.5 * k * k;
                return -0.5 * (--k * (k - 2) - 1);
            }
        },

        Cubic: {
            In: function(k) {
                return k * k * k;
            },

            Out: function(k) {
                return --k * k * k + 1;
            },

            InOut: function(k) {
                if ((k *= 2) < 1) return 0.5 * k * k * k;
                return 0.5 * ((k -= 2) * k * k + 2);
            }
        },

        Quartic: {
            In: function(k) {
                return k * k * k * k;
            },

            Out: function(k) {
                return 1 - (--k * k * k * k);
            },

            InOut: function(k) {
                if ((k *= 2) < 1) return 0.5 * k * k * k * k;
                return -0.5 * ((k -= 2) * k * k * k - 2);
            }
        },

        Quintic: {
            In: function(k) {
                return k * k * k * k * k;
            },

            Out: function(k) {
                return --k * k * k * k * k + 1;
            },

            InOut: function(k) {
                if ((k *= 2) < 1) return 0.5 * k * k * k * k * k;
                return 0.5 * ((k -= 2) * k * k * k * k + 2);
            }
        },

        Sinusoidal: {
            In: function(k) {
                return 1 - Math.cos(k * Math.PI / 2);
            },

            Out: function(k) {
                return Math.sin(k * Math.PI / 2);
            },

            InOut: function(k) {
                return 0.5 * (1 - Math.cos(Math.PI * k));
            }
        },

        Exponential: {
            In: function(k) {
                return k === 0 ? 0 : Math.pow(1024, k - 1);
            },

            Out: function(k) {
                return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
            },

            InOut: function(k) {
                if (k === 0) return 0;
                if (k === 1) return 1;
                if ((k *= 2) < 1) return 0.5 * Math.pow(1024, k - 1);
                return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
            }
        },

        Circular: {
            In: function(k) {
                return 1 - Math.sqrt(1 - k * k);
            },

            Out: function(k) {
                return Math.sqrt(1 - (--k * k));
            },

            InOut: function(k) {
                if ((k *= 2) < 1) return -0.5 * (Math.sqrt(1 - k * k) - 1);
                return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
            }
        },

        Elastic: {
            In: function(k) {
                var s, a = 0.1,
                    p = 0.4;
                if (k === 0) return 0;
                if (k === 1) return 1;
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                }
                else s = p * Math.asin(1 / a) / (2 * Math.PI);
                return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
            },

            Out: function(k) {
                var s, a = 0.1,
                    p = 0.4;
                if (k === 0) return 0;
                if (k === 1) return 1;
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                }
                else s = p * Math.asin(1 / a) / (2 * Math.PI);
                return (a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);
            },

            InOut: function(k) {
                var s, a = 0.1,
                    p = 0.4;
                if (k === 0) return 0;
                if (k === 1) return 1;
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                }
                else s = p * Math.asin(1 / a) / (2 * Math.PI);
                if ((k *= 2) < 1) return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
                return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;
            }
        },

        Back: {
            In: function(k) {
                var s = 1.70158;
                return k * k * ((s + 1) * k - s);
            },

            Out: function(k) {
                var s = 1.70158;
                return --k * k * ((s + 1) * k + s) + 1;
            },

            InOut: function(k) {
                var s = 1.70158 * 1.525;
                if ((k *= 2) < 1) return 0.5 * (k * k * ((s + 1) * k - s));
                return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
            }
        },

        Bounce: {
            In: function(k) {
                return 1 - game.Tween.Easing.Bounce.Out(1 - k);
            },

            Out: function(k) {
                if (k < (1 / 2.75)) {
                    return 7.5625 * k * k;
                }
                else if (k < (2 / 2.75)) {
                    return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
                }
                else if (k < (2.5 / 2.75)) {
                    return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
                }
                else {
                    return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
                }
            },
            
            InOut: function(k) {
                if (k < 0.5) return game.Tween.Easing.Bounce.In(k * 2) * 0.5;
                return game.Tween.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
            }
        }
    },

    /**
        @attribute {Object} Interpolation
    **/
    Interpolation: {
        Linear: function(v, k) {
            var m = v.length - 1,
                f = m * k,
                i = Math.floor(f),
                fn = game.Tween.Interpolation.Utils.Linear;
            if (k < 0) return fn(v[0], v[1], f);
            if (k > 1) return fn(v[m], v[m - 1], m - f);
            return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);
        },

        Bezier: function(v, k) {
            var b = 0,
                n = v.length - 1,
                pw = Math.pow,
                bn = game.Tween.Interpolation.Utils.Bernstein,
                i;
            for (i = 0; i <= n; i++) {
                b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
            }
            return b;
        },

        CatmullRom: function(v, k) {
            var m = v.length - 1,
                f = m * k,
                i = Math.floor(f),
                fn = game.Tween.Interpolation.Utils.CatmullRom;
            if (v[0] === v[m]) {
                if (k < 0) i = Math.floor(f = m * (1 + k));
                return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);
            }
            else {
                if (k < 0) return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
                if (k > 1) return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
                return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);
            }
        },

        Utils: {
            Linear: function(p0, p1, t) {
                return (p1 - p0) * t + p0;
            },

            Bernstein: function(n, i) {
                var fc = game.Tween.Interpolation.Utils.Factorial;
                return fc(n) / fc(i) / fc(n - i);
            },

            Factorial: (function() {
                var a = [1];
                return function (n) {
                    var s = 1, i;
                    if (a[n]) return a[n];
                    for (i = n; i > 1; i--) s *= i;
                    return a[n] = s;
                };
            })(),

            CatmullRom: function(p0, p1, p2, p3, t) {
                var v0 = (p2 - p0) * 0.5,
                    v1 = (p3 - p1) * 0.5,
                    t2 = t * t,
                    t3 = t * t2;
                return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
            }
        }
    },

    /**
        @method getTweensForObject
        @static
        @param {Class} object
        @return {Array}
    **/
    getTweensForObject: function(object) {
        var tweens = [];
        if (!game.scene) return tweens;
        for (var i = game.scene.tweens.length - 1; i >= 0; i--) {
            var tween = game.scene.tweens[i];
            if (tween.object === object) tweens.push(tween);
        };
        return tweens;
    },

    /**
        @method stopTweensForObject
        @static
        @param {Class} object
    **/
    stopTweensForObject: function(object) {
        if (!game.scene) return;
        for (var i = game.scene.tweens.length - 1; i >= 0; i--) {
            var tween = game.scene.tweens[i];
            if (tween.object === object) tween.stop();
        };
    }
});

/**
    @class TweenGroup
    @constructor
    @param {Function} [onComplete]
**/
game.createClass('TweenGroup', {
    /**
        On complete callback for group.
        @property {Function} onComplete
    **/
    onComplete: null,
    /**
        List of tweens in group.
        @property {Array} tweens
    **/
    tweens: [],
    /**
        @property {Boolean} _complete
        @private
    **/
    _complete: false,

    staticInit: function(onComplete) {
        this.onComplete = onComplete;
    },

    /**
        Add tween to group.
        @method add
        @param {Tween} tween
        @return {Tween}
    **/
    add: function(tween) {
        tween.onComplete(this._tweenComplete.bind(this));
        this.tweens.push(tween);
        return tween;
    },

    /**
        Pause tweening.
        @method pause
    **/
    pause: function() {
        for (var i = 0; i < this.tweens.length; i++) {
            this.tweens[i].pause();
        }
    },

    /**
        Remove tween from group.
        @method remove
        @param {Tween} tween
    **/
    remove: function(tween) {
        this.tweens.erase(tween);
    },

    /**
        Resume tweening.
        @method resume
    **/
    resume: function() {
        for (var i = 0; i < this.tweens.length; i++) {
            this.tweens[i].resume();
        }
    },

    /**
        Start tweening.
        @method start
    **/
    start: function() {
        for (var i = 0; i < this.tweens.length; i++) {
            this.tweens[i].start();
        }
    },

    /**
        Stop tweening.
        @method stop
        @param {Boolean} doComplete Call onComplete function
        @param {Boolean} endTween Set started tweens to end values
    **/
    stop: function(doComplete, endTween) {
        if (this._complete) return;

        for (var i = 0; i < this.tweens.length; i++) {
            this.tweens[i].stop(endTween);
        }
        
        if (!this._complete && doComplete) this._tweenComplete();
        this._complete = true;
    },

    /**
        @method _tweenComplete
        @private
    **/
    _tweenComplete: function() {
        if (this._complete) return;
        for (var i = 0; i < this.tweens.length; i++) {
            if (this.tweens[i].playing) return;
        }
        this._complete = true;
        if (typeof this.onComplete === 'function') this.onComplete();
    }
});

});
