/**
    @module keyboard
    @namespace game
**/
game.module(
    'engine.keyboard'
)
.body(function() {
'use strict';

/**
    @class Keyboard
    @extends game.Class
**/
game.createClass('Keyboard', {
    keysDown: [],

    init: function() {
        window.addEventListener('keydown', this.keydown.bind(this));
        window.addEventListener('keyup', this.keyup.bind(this));
        window.addEventListener('blur', this.resetKeys.bind(this));
    },

    resetKeys: function() {
        for (var key in this.keysDown) {
            this.keysDown[key] = false;
        }
    },

    keydown: function(event) {
        if (!game.scene) return;
        if (!game.Keyboard.keys[event.keyCode]) {
            // Unknown key
            game.Keyboard.keys[event.keyCode] = event.keyCode;
        }
        if (this.keysDown[game.Keyboard.keys[event.keyCode]]) return; // Key already down

        this.keysDown[game.Keyboard.keys[event.keyCode]] = true;
        var prevent = game.scene.keydown(game.Keyboard.keys[event.keyCode], this.down('SHIFT'), this.down('CTRL'), this.down('ALT'));
        if (prevent) event.preventDefault();
    },

    keyup: function(event) {
        if (!game.scene) return;
        this.keysDown[game.Keyboard.keys[event.keyCode]] = false;
        game.scene.keyup(game.Keyboard.keys[event.keyCode]);
    },

    /**
        Check if key is pressed down.
        @method down
        @return {Boolean}
    **/
    down: function(key) {
        return !!this.keysDown[key];
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
