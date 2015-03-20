/**
    @module input
**/
game.module(
    'engine.input'
)
.body(function() {
'use strict';

game.createClass('Input', {
    init: function() {
        game.renderer.canvas.addEventListener('touchstart', this._touchstart.bind(this));
        game.renderer.canvas.addEventListener('touchmove', this._touchmove.bind(this));
        game.renderer.canvas.addEventListener('touchend', this._touchend.bind(this));
        game.renderer.canvas.addEventListener('mousedown', this._mousedown.bind(this));
        game.renderer.canvas.addEventListener('mousemove', this._mousemove.bind(this));
        window.addEventListener('mouseup', this._mouseup.bind(this));
    },

    _touchstart: function(event) {
        event.preventDefault();
        for (var i = 0; i < event.changedTouches.length; i++) {
            this._mousedown(event.changedTouches[i]);
        }
    },

    _touchmove: function(event) {
        event.preventDefault();
        for (var i = 0; i < event.changedTouches.length; i++) {
            this._mousemove(event.changedTouches[i]);
        }
    },

    _touchend: function(event) {
        event.preventDefault();
        for (var i = 0; i < event.changedTouches.length; i++) {
            this._mouseup(event.changedTouches[i]);
        }
    },

    /**
        @method _mousedown
        @param {MouseEvent} event
        @private
    **/
    _mousedown: function(event) {
        if (event.preventDefault) event.preventDefault();
        var rect = game.renderer.canvas.getBoundingClientRect();
        var x = (event.clientX - rect.left) * (game.renderer.canvas.width / rect.width);
        var y = (event.clientY - rect.top) * (game.renderer.canvas.height / rect.height);
        if (game.scene._mousedown) game.scene._mousedown(x, y, event);
        this._processMouseDown(game.scene.stage, x, y, event);
    },

    _processMouseDown: function(container, x, y, event) {
        if (!container.interactive && container.parent) {
            this._fireEvent(container.parent, 'mousedown', x, y, event);
            return;
        }
        if (container.children.length === 0) {
            this._fireEvent(container, 'mousedown', x, y, event);
            return;
        }
        container._waitForInput = container.children.length;
        container._inputFired = false;
        for (var i = 0; i < container.children.length; i++) {
            var child = container.children[i];
            if (!child.interactive) continue;
            this._processMouseDown(child, x, y, event);
        }
    },

    _fireEvent: function(container, eventName, x, y, originalEvent) {
        if (!container.parent) return;
        if (container._waitForInput > 0) return;
        if (container._inputFired) return;

        container.parent._waitForInput--;
        
        if (this._hitTest(container, x, y)) {
            container.parent._inputFired = true;
            container[eventName](x, y, originalEvent);
            return;
        }

        if (container.parent) this._fireEvent(container.parent, eventName, x, y, originalEvent);
    },

    _hitTest: function(container, x, y) {
        var bounds = container._worldBounds;
        return (x >= bounds.x && y >= bounds.y && x <= bounds.x + bounds.width && y <= bounds.y + bounds.height);
    },

    /**
        @method _mousemove
        @param {MouseEvent} event
        @private
    **/
    _mousemove: function(event) {
        if (event.preventDefault) event.preventDefault();
        var rect = game.renderer.canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        if (game.scene._mousemove) game.scene._mousemove(x, y, event);
        this._processMouseMove(game.scene.stage, x, y);
    },

    _processMouseMove: function(container, x, y) {

    },

    /**
        @method _mouseup
        @param {MouseEvent} event
        @private
    **/
    _mouseup: function(event) {
        if (event.preventDefault) event.preventDefault();
        var rect = game.renderer.canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        if (game.scene._mouseup) game.scene._mouseup(x, y, event);
    }
});

/**
    @class Keyboard
**/
game.createClass('Keyboard', {
    /**
        @property {Array} _keysDown
        @private
    **/
    _keysDown: [],

    init: function() {
        window.addEventListener('keydown', this._keydown.bind(this));
        window.addEventListener('keyup', this._keyup.bind(this));
        window.addEventListener('blur', this._resetKeys.bind(this));
    },

    /**
        Check if key is pressed down.
        @method down
        @param {String} key
        @return {Boolean}
    **/
    down: function(key) {
        return !!this._keysDown[key];
    },

    /**
        @method _resetKeys
        @private
    **/
    _resetKeys: function() {
        for (var key in this._keysDown) {
            this._keysDown[key] = false;
        }
    },

    /**
        @method _keydown
        @private
    **/
    _keydown: function(event) {
        if (!game.Keyboard.keys[event.keyCode]) {
            // Unknown key
            game.Keyboard.keys[event.keyCode] = event.keyCode;
        }
        if (this._keysDown[game.Keyboard.keys[event.keyCode]]) return; // Key already down

        this._keysDown[game.Keyboard.keys[event.keyCode]] = true;
        if (game.scene && game.scene.keydown) {
            var prevent = game.scene.keydown(game.Keyboard.keys[event.keyCode], this.down('SHIFT'), this.down('CTRL'), this.down('ALT'));
            if (prevent) event.preventDefault();
        }
    },

    /**
        @method _keyup
        @private
    **/
    _keyup: function(event) {
        this._keysDown[game.Keyboard.keys[event.keyCode]] = false;
        if (game.scene && game.scene.keyup) {
            game.scene.keyup(game.Keyboard.keys[event.keyCode]);
        }
    }
});

game.addAttributes('Keyboard', {
    /**
        List of available keys.
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
        189: 'MINUS',
        192: 'GRAVE_ACCENT',
        222: 'SINGLE_QUOTE'
    }
});

game.keyboard = new game.Keyboard();

});
