/**
    @module input
**/
game.module(
    'engine.input'
)
.body(function() {

/**
    Interactivity controller. Instance automatically created at `game.input`
    @class Input
    @constructor
    @param {HTMLCanvasElement} canvas
**/
game.createClass('Input', {
    /**
        List of interactive items.
        @property {Array} items
    **/
    items: [],
    /**
        Device motion info.
        @property {DeviceMotionEvent} motion
    **/
    motion: null,
    /**
        Mouse position.
        @property {Vector} mouse
    **/
    mouse: null,
    /**
        List of current touch identifiers.
        @property {Array} touches
    **/
    touches: [],
    /**
        @property {String} _currentCursor
        @private
    **/
    _currentCursor: null,
    /**
        @property {Container} _mouseDownItem
        @private
    **/
    _mouseDownItem: null,
    /**
        @property {Number} _mouseDownTime
        @private
    **/
    _mouseDownTime: null,
    /**
        @property {Container} _mouseMoveItem
        @private
    **/
    _mouseMoveItem: null,
    /**
        @property {Container} _mouseUpItem
        @private
    **/
    _mouseUpItem: null,
    /**
        @property {Boolean} _needUpdate
        @default false
        @private
    **/
    _needUpdate: false,

    init: function(canvas) {
        this.mouse = new game.Vector();
        this._touchstartFunc = this._touchstart.bind(this);
        this._touchmoveFunc = this._touchmove.bind(this);
        this._touchendFunc = this._touchend.bind(this);
        this._mousedownFunc = this._mousedown.bind(this);
        this._mousemoveFunc = this._mousemove.bind(this);
        this._mouseoutFunc = this._mouseout.bind(this);
        this._mouseupFunc = this._mouseup.bind(this);
        var target = game.device.cocoonCanvasPlus ? window : canvas;
        target.addEventListener('touchstart', this._touchstartFunc);
        target.addEventListener('touchmove', this._touchmoveFunc);
        target.addEventListener('touchend', this._touchendFunc);
        target.addEventListener('touchcancel', this._touchendFunc);
        target.addEventListener('mousedown', this._mousedownFunc);
        target.addEventListener('mousemove', this._mousemoveFunc);
        target.addEventListener('mouseout', this._mouseoutFunc);
        window.addEventListener('blur', this._mouseoutFunc);
        window.addEventListener('mouseup', this._mouseupFunc);
        if (game.device.mobile) {
            this._devicemotionFunc = this._devicemotion.bind(this);
            window.addEventListener('devicemotion', this._devicemotionFunc);
        }
    },

    /**
        @method _calculateXY
        @param {MouseEvent|TouchEvent} event
        @private
    **/
    _calculateXY: function(event) {
        var rect = game.renderer.canvas.getBoundingClientRect();
        var x = (event.clientX - rect.left) * (game.renderer.canvas.width / rect.width);
        var y = (event.clientY - rect.top) * (game.renderer.canvas.height / rect.height);
        event.canvasX = x / game.scale;
        event.canvasY = y / game.scale;
    },

    /**
        @method _devicemotion
        @param {DeviceMotionEvent} event
        @private
    **/
    _devicemotion: function(event) {
        this.motion = event;
    },

    /**
        @method _hitTest
        @param {Container} container
        @param {Number} x
        @param {Number} y
        @return {Boolean}
        @private
    **/
    _hitTest: function(container, x, y) {
        var hitArea = container.hitArea;
        if (hitArea) {
            var wt = container._worldTransform;
            var bounds = container._getBounds();
            var tx = typeof bounds.x === 'number' ? bounds.x : wt.tx;
            var ty = typeof bounds.y === 'number' ? bounds.y : wt.ty;
            var scaleX = Math.abs(wt.a / container._cosCache);
            var scaleY = Math.abs(wt.d / container._cosCache);
            var aPercX = (container.anchor.x / container.width) || 0;
            var aPercY = (container.anchor.y / container.height) || 0;
            var hx = tx + hitArea.x * scaleX;
            var hy = ty + hitArea.y * scaleY;
            hx += bounds.width * scaleX * aPercX;
            hy += bounds.height * scaleY * aPercY;
            if (hitArea.radius) {
                var r = hitArea.radius * game.scale;
                var a = x - hx;
                var b = y - hy;
                var c = Math.sqrt(a * a + b * b);
                return (c < r);
            }
            var hw = hitArea.width * scaleX;
            var hh = hitArea.height * scaleY;
        }
        else {
            hitArea = container._getBounds();
            var hx = hitArea.x;
            var hy = hitArea.y;
            var hw = hitArea.width;
            var hh = hitArea.height;
        }

        return (x >= hx && y >= hy && x <= hx + hw && y <= hy + hh);
    },

    /**
        @method _mousedown
        @param {MouseEvent|TouchEvent} event
        @private
    **/
    _mousedown: function(event) {
        if (game.audio && game.audio._context && game.audio._context.state === 'suspended') game.audio._context.resume();
        if (game.Input.focusOnMouseDown) {
            window.focus();
            game.renderer.canvas.focus();
        }
        if (!game.scene) return;

        this._preventDefault(event);
        this._calculateXY(event);
        this.mouse.set(event.canvasX, event.canvasY);
        
        this._mouseDownItem = this._processEvent('mousedown', event);
        this._mouseDownTime = game.Timer.time;

        game.scene._mousedown(event.canvasX, event.canvasY, event.identifier, event);
    },

    /**
        @method _mousemove
        @param {MouseEvent|TouchEvent} event
        @private
    **/
    _mousemove: function(event) {
        if (!game.scene) return;

        this._preventDefault(event);
        this._calculateXY(event);
        this.mouse.set(event.canvasX, event.canvasY);

        var _mouseMoveItem = this._processEvent('mousemove', event);
        
        this._updateCursor(_mouseMoveItem);

        if (this._mouseMoveItem && this._mouseMoveItem !== _mouseMoveItem) {
            this._mouseMoveItem.mouseout(event.canvasX, event.canvasY, event.identifier, event);
        }
        if (_mouseMoveItem && this._mouseMoveItem !== _mouseMoveItem) {
            _mouseMoveItem.mouseover(event.canvasX, event.canvasY, event.identifier, event);
        }
        this._mouseMoveItem = _mouseMoveItem;

        game.scene._mousemove(event.canvasX, event.canvasY, event.identifier, event);
    },

    /**
        @method _mouseout
        @param {MouseEvent|TouchEvent} event
        @private
    **/
    _mouseout: function(event) {
        if (!game.scene) return;

        if (this._mouseMoveItem) this._mouseMoveItem.mouseout(event.canvasX, event.canvasY, event.identifier, event);
        this._mouseMoveItem = null;
        
        game.scene.mouseout(event);
    },

    /**
        @method _mouseup
        @param {MouseEvent|TouchEvent} event
        @private
    **/
    _mouseup: function(event) {
        if (!game.scene) return;

        this._preventDefault(event);
        this._calculateXY(event);
        if (event.canvasX < 0 || event.canvasX > game.width || event.canvasY < 0 || event.canvasY > game.height) {
            if (this._mouseDownItem) {
                this._mouseDownItem.mouseupoutside(event.canvasX, event.canvasY, event.identifier, event);
            }
            game.scene._mouseup(event.canvasX, event.canvasY, event.identifier, event);
            return;
        }
        this.mouse.set(event.canvasX, event.canvasY);

        this._mouseUpItem = this._processEvent('mouseup', event);
        if (this._mouseDownItem && this._mouseDownItem === this._mouseUpItem) {
            var time = game.Timer.time - this._mouseDownTime;
            if (game.Input.clickTimeout === 0 || time < game.Input.clickTimeout) {
                this._mouseDownItem.click(event.canvasX, event.canvasY, event.identifier, event);
            }
        }

        if (this._mouseDownItem && this._mouseDownItem !== this._mouseUpItem) {
            this._mouseDownItem.mouseupoutside(event.canvasX, event.canvasY, event.identifier, event);
        }

        game.scene._mouseup(event.canvasX, event.canvasY, event.identifier, event);
    },

    /**
        @method _preventDefault
        @param {MouseEvent|TouchEvent} event
        @private
    **/
    _preventDefault: function(event) {
        if (!event.preventDefault || !game.Input.preventDefault) return;
        event.preventDefault();
    },

    /**
        @method _processEvent
        @param {String} eventName
        @param {MouseEvent|TouchEvent} event
        @return {Object} item
        @private
    **/
    _processEvent: function(eventName, event) {
        for (var i = this.items.length - 1; i >= 0; i--) {
            var item = this.items[i];
            if (!item._interactive || !item.visible) continue;
            if (this._hitTest(item, event.canvasX, event.canvasY)) {
                if (!item[eventName](event.canvasX, event.canvasY, event.identifier, event)) {
                    return item;
                }
            }
        }
    },
    
    /**
        Remove all event listeners.
        @method _remove
        @private
    **/
    _remove: function() {
        var target = game.device.cocoonCanvasPlus ? window : canvas;
        target.removeEventListener('touchstart', this._touchstartFunc);
        target.removeEventListener('touchmove', this._touchmoveFunc);
        target.removeEventListener('touchend', this._touchendFunc);
        target.removeEventListener('touchcancel', this._touchendFunc);
        target.removeEventListener('mousedown', this._mousedownFunc);
        target.removeEventListener('mousemove', this._mousemoveFunc);
        target.removeEventListener('mouseout', this._mouseoutFunc);
        window.removeEventListener('blur', this._mouseoutFunc);
        window.removeEventListener('mouseup', this._mouseupFunc);
        if (this._devicemotionFunc) window.removeEventListener('devicemotion', this._devicemotionFunc);
    },

    /**
        @method _reset
        @private
    **/
    _reset: function() {
        this.items.length = 0;
        this._mouseDownItem = null;
        this._mouseMoveItem = null;
        this._mouseUpItem = null;
    },

    /**
        @method _touchend
        @param {TouchEvent} event
        @private
    **/
    _touchend: function(event) {
        this._preventDefault(event);
        for (var i = 0; i < event.changedTouches.length; i++) {
            var touch = event.changedTouches[i];
            if (this.touches.indexOf(touch.identifier) !== -1) {
                this._mouseup(touch);
                this.touches.erase(touch.identifier);
            }
        }
    },

    /**
        @method _touchmove
        @param {TouchEvent} event
        @private
    **/
    _touchmove: function(event) {
        this._preventDefault(event);
        for (var i = 0; i < event.changedTouches.length; i++) {
            var touch = event.changedTouches[i];
            if (this.touches.indexOf(touch.identifier) !== -1) this._mousemove(touch);
        }
    },

    /**
        @method _touchstart
        @param {TouchEvent} event
        @private
    **/
    _touchstart: function(event) {
        if (game.audio && game.audio._context && game.audio._context.state === 'suspended') game.audio._context.resume();
        this._preventDefault(event);
        for (var i = 0; i < event.changedTouches.length; i++) {
            if (this.touches.length === 1 && !game.Input.multitouch) return;
            var touch = event.changedTouches[i];
            this.touches.push(touch.identifier);
            this._mousedown(touch);
        }
    },

    /**
        @method _update
        @private
    **/
    _update: function() {
        if (!this._needUpdate) return;

        this.items.length = 0;
        this._updateItems(game.scene.stage);
        this._needUpdate = false;
    },

    /**
        @method _updateCursor
        @private
    **/
    _updateCursor: function(container) {
        if (game.device.mobile) return;

        var cursor = 'inherit';
        if (container && container.buttonMode) {
            cursor = game.Input.buttonModeCursor;
        }
        if (this._currentCursor !== cursor) {
            this._currentCursor = cursor;
            game.renderer.canvas.style.cursor = this._currentCursor;
        }
    },

    /**
        @method _updateItems
        @param {Container} container
        @private
    **/
    _updateItems: function(container) {
        for (var i = 0; i < container.children.length; i++) {
            var child = container.children[i];
            if (child._interactive) this.items.push(child);
            if (child.children.length) this._updateItems(child);
        }
    }
});

game.addAttributes('Input', {
    /**
        Cursor to use on buttonMode.
        @attribute {String} buttonModeCursor
        @default pointer
    **/
    buttonModeCursor: 'pointer',
    /**
        Time after click is not called (ms).
        @attribute {Number} clickTimeout
        @default 500
    **/
    clickTimeout: 500,
    /**
        Set focus to canvas in mousedown event.
        @attribute {Boolean} focusOnMouseDown
        @default true
    **/
    focusOnMouseDown: true,
    /**
        Enable multitouch.
        @attribute {Boolean} multitouch
        @default true
    **/
    multitouch: true,
    /**
        Should mouse and touch events prevent default action.
        @attribute {Boolean} preventDefault
        @default true
    **/
    preventDefault: true
});

/**
    Keyboard controller. Instance automatically created at `game.keyboard`
    @class Keyboard
**/
game.createClass('Keyboard', {
    /**
        @property {Array} _keysDown
        @private
    **/
    _keysDown: [],

    init: function() {
        this._keydownFunc = this._keydown.bind(this);
        this._keyupFunc = this._keyup.bind(this);
        this._resetFunc = this._reset.bind(this);
        window.addEventListener('keydown', this._keydownFunc);
        window.addEventListener('keyup', this._keyupFunc);
        window.addEventListener('blur', this._resetFunc);
    },

    /**
        Check if key is pressed down.
        @method down
        @param {String} key
        @return {Boolean}
    **/
    down: function(key) {
        return !!this._keysDown[key.toUpperCase()];
    },

    /**
        @method _keydown
        @param {KeyboardEvent} event
        @private
    **/
    _keydown: function(event) {
        if (document.activeElement !== document.body && document.activeElement !== game.renderer.canvas) return;
        if (!game.system._running) return;
        if (game.Keyboard.preventDefault) event.preventDefault();
        var key = game.Keyboard.keys[event.keyCode];
        if (!key) key = event.keyCode;
        if (this._keysDown[key]) {
            event.preventDefault();
            return;
        }
        this._keysDown[key] = true;
        if (game.scene && game.scene.keydown) {
            var prevent = game.scene.keydown(key, this.down('SHIFT'), this.down('CTRL'), this.down('ALT'));
            if (prevent) event.preventDefault();
        }
    },

    /**
        @method _keyup
        @param {KeyboardEvent} event
        @private
    **/
    _keyup: function(event) {
        if (!game.system._running) return;
        var key = game.Keyboard.keys[event.keyCode];
        if (!key) key = event.keyCode;
        this._keysDown[key] = false;
        if (game.scene && game.scene.keyup) game.scene.keyup(key);
    },
    
    /**
        Remove all event listeners.
        @method _remove
        @private
    **/
    _remove: function() {
        window.removeEventListener('keydown', this._keydownFunc);
        window.removeEventListener('keyup', this._keyupFunc);
        window.removeEventListener('blur', this._resetFunc);
    },

    /**
        @method _reset
        @private
    **/
    _reset: function() {
        for (var key in this._keysDown) {
            this._keysDown[key] = false;
        }
    }
});

game.addAttributes('Keyboard', {
    /**
        List of key codes and their key names. Key events are not called to key codes, that are not in the list.
        @attribute {Object} keys
    **/
    keys: {
        8: 'BACKSPACE',
        9: 'TAB',
        13: 'ENTER',
        16: 'SHIFT',
        17: 'CTRL',
        18: 'ALT',
        19: 'PAUSE',
        20: 'CAPS_LOCK',
        27: 'ESC',
        32: 'SPACE',
        33: 'PAGE_UP',
        34: 'PAGE_DOWN',
        35: 'END',
        36: 'HOME',
        37: 'LEFT',
        38: 'UP',
        39: 'RIGHT',
        40: 'DOWN',
        44: 'PRINT_SCREEN',
        45: 'INSERT',
        46: 'DELETE',
        48: '0',
        49: '1',
        50: '2',
        51: '3',
        52: '4',
        53: '5',
        54: '6',
        55: '7',
        56: '8',
        57: '9',
        65: 'A',
        66: 'B',
        67: 'C',
        68: 'D',
        69: 'E',
        70: 'F',
        71: 'G',
        72: 'H',
        73: 'I',
        74: 'J',
        75: 'K',
        76: 'L',
        77: 'M',
        78: 'N',
        79: 'O',
        80: 'P',
        81: 'Q',
        82: 'R',
        83: 'S',
        84: 'T',
        85: 'U',
        86: 'V',
        87: 'W',
        88: 'X',
        89: 'Y',
        90: 'Z',
        96: 'NUM_ZERO',
        97: 'NUM_ONE',
        98: 'NUM_TWO',
        99: 'NUM_THREE',
        100: 'NUM_FOUR',
        101: 'NUM_FIVE',
        102: 'NUM_SIX',
        103: 'NUM_SEVEN',
        104: 'NUM_EIGHT',
        105: 'NUM_NINE',
        106: 'NUM_MULTIPLY',
        107: 'NUM_PLUS',
        109: 'NUM_MINUS',
        110: 'NUM_PERIOD',
        111: 'NUM_DIVISION',
        112: 'F1',
        113: 'F2',
        114: 'F3',
        115: 'F4',
        116: 'F5',
        117: 'F6',
        118: 'F7',
        119: 'F8',
        120: 'F9',
        121: 'F10',
        122: 'F11',
        123: 'F12',
        186: 'SEMICOLON',
        187: 'PLUS',
        188: 'COMMA',
        189: 'MINUS',
        190: 'PERIOD',
        192: 'GRAVE_ACCENT',
        222: 'SINGLE_QUOTE'
    },
    /**
        Should keydown event prevent default action.
        @attribute {Boolean} preventDefault
        @default false
    **/
    preventDefault: false
});

});
