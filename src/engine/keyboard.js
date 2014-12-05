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
game.Keyboard = game.Class.extend({
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

/**
    List of available keys.
    @attribute {Array} keys
**/
game.Keyboard.keys = [];
game.Keyboard.keys[8] = 'BACKSPACE';
game.Keyboard.keys[9] = 'TAB';
game.Keyboard.keys[13] = 'ENTER';
game.Keyboard.keys[16] = 'SHIFT';
game.Keyboard.keys[17] = 'CTRL';
game.Keyboard.keys[18] = 'ALT';
game.Keyboard.keys[19] = 'PAUSE';
game.Keyboard.keys[20] = 'CAPS_LOCK';
game.Keyboard.keys[27] = 'ESC';
game.Keyboard.keys[32] = 'SPACE';
game.Keyboard.keys[33] = 'PAGE_UP';
game.Keyboard.keys[34] = 'PAGE_DOWN';
game.Keyboard.keys[35] = 'END';
game.Keyboard.keys[36] = 'HOME';
game.Keyboard.keys[37] = 'LEFT';
game.Keyboard.keys[38] = 'UP';
game.Keyboard.keys[39] = 'RIGHT';
game.Keyboard.keys[40] = 'DOWN';
game.Keyboard.keys[44] = 'PRINT_SCREEN';
game.Keyboard.keys[45] = 'INSERT';
game.Keyboard.keys[46] = 'DELETE';
game.Keyboard.keys[48] = '0';
game.Keyboard.keys[49] = '1';
game.Keyboard.keys[50] = '2';
game.Keyboard.keys[51] = '3';
game.Keyboard.keys[52] = '4';
game.Keyboard.keys[53] = '5';
game.Keyboard.keys[54] = '6';
game.Keyboard.keys[55] = '7';
game.Keyboard.keys[56] = '8';
game.Keyboard.keys[57] = '9';
game.Keyboard.keys[65] = 'A';
game.Keyboard.keys[66] = 'B';
game.Keyboard.keys[67] = 'C';
game.Keyboard.keys[68] = 'D';
game.Keyboard.keys[69] = 'E';
game.Keyboard.keys[70] = 'F';
game.Keyboard.keys[71] = 'G';
game.Keyboard.keys[72] = 'H';
game.Keyboard.keys[73] = 'I';
game.Keyboard.keys[74] = 'J';
game.Keyboard.keys[75] = 'K';
game.Keyboard.keys[76] = 'L';
game.Keyboard.keys[77] = 'M';
game.Keyboard.keys[78] = 'N';
game.Keyboard.keys[79] = 'O';
game.Keyboard.keys[80] = 'P';
game.Keyboard.keys[81] = 'Q';
game.Keyboard.keys[82] = 'R';
game.Keyboard.keys[83] = 'S';
game.Keyboard.keys[84] = 'T';
game.Keyboard.keys[85] = 'U';
game.Keyboard.keys[86] = 'V';
game.Keyboard.keys[87] = 'W';
game.Keyboard.keys[88] = 'X';
game.Keyboard.keys[89] = 'Y';
game.Keyboard.keys[90] = 'Z';
game.Keyboard.keys[96] = 'NUM_ZERO';
game.Keyboard.keys[97] = 'NUM_ONE';
game.Keyboard.keys[98] = 'NUM_TWO';
game.Keyboard.keys[99] = 'NUM_THREE';
game.Keyboard.keys[100] = 'NUM_FOUR';
game.Keyboard.keys[101] = 'NUM_FIVE';
game.Keyboard.keys[102] = 'NUM_SIX';
game.Keyboard.keys[103] = 'NUM_SEVEN';
game.Keyboard.keys[104] = 'NUM_EIGHT';
game.Keyboard.keys[105] = 'NUM_NINE';
game.Keyboard.keys[106] = 'NUM_MULTIPLY';
game.Keyboard.keys[107] = 'NUM_PLUS';
game.Keyboard.keys[109] = 'NUM_MINUS';
game.Keyboard.keys[110] = 'NUM_PERIOD';
game.Keyboard.keys[111] = 'NUM_DIVISION';
game.Keyboard.keys[112] = 'F1';
game.Keyboard.keys[113] = 'F2';
game.Keyboard.keys[114] = 'F3';
game.Keyboard.keys[115] = 'F4';
game.Keyboard.keys[116] = 'F5';
game.Keyboard.keys[117] = 'F6';
game.Keyboard.keys[118] = 'F7';
game.Keyboard.keys[119] = 'F8';
game.Keyboard.keys[120] = 'F9';
game.Keyboard.keys[121] = 'F10';
game.Keyboard.keys[122] = 'F11';
game.Keyboard.keys[123] = 'F12';
game.Keyboard.keys[187] = 'PLUS';
game.Keyboard.keys[189] = 'MINUS';

game.keyboard = new game.Keyboard();

});
