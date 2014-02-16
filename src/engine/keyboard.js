/**
    Keyboard manager.
    
    @module keyboard
    @namespace game
**/
game.module(
    'engine.keyboard'
)
.body(function() {

/**
    Instance automatically created at {{#crossLink "game.Core"}}{{/crossLink}}
    @class Keyboard
    @extends game.Class
**/
game.Keyboard = game.Class.extend({
    /**
        List of keys.

            BACKSPACE
            TAB
            ENTER
            SHIFT
            CTRL
            ALT
            PAUSE
            CAPS_LOCK
            ESC
            SPACE
            PAGE_UP
            PAGE_DOWN
            END
            HOME
            LEFT
            UP
            RIGHT
            DOWN
            PRINT_SCREEN
            INSERT
            DELETE
            ZERO
            ONE
            TWO
            THREE
            FOUR
            FIVE
            SIX
            SEVEN
            EIGHT
            NINE
            A
            B
            C
            D
            E
            F
            G
            H
            I
            J
            K
            L
            M
            N
            O
            P
            Q
            R
            S
            T
            U
            V
            W
            X
            Y
            Z
            NUM_ZERO
            NUM_ONE
            NUM_TWO
            NUM_THREE
            NUM_FOUR
            NUM_FIVE
            NUM_SIX
            NUM_SEVEN
            NUM_EIGHT
            NUM_NINE
            NUM_MULTIPLY
            NUM_PLUS
            NUM_MINUS
            NUM_PERIOD
            NUM_DIVISION
            F1
            F2
            F3
            F4
            F5
            F6
            F7
            F8
            F9
            F10
            F11
            F12

        @property {Array} keys
    **/
    keys: [],
    /**
        List of keys, that are pressed down.
        @property {Array} keysDown
    **/
    keysDown: [],

    init: function() {
        this.keys[8] = 'BACKSPACE';
        this.keys[9] = 'TAB';
        this.keys[13] = 'ENTER';
        this.keys[16] = 'SHIFT';
        this.keys[17] = 'CTRL';
        this.keys[18] = 'ALT';
        this.keys[19] = 'PAUSE';
        this.keys[20] = 'CAPS_LOCK';
        this.keys[27] = 'ESC';
        this.keys[32] = 'SPACE';
        this.keys[33] = 'PAGE_UP';
        this.keys[34] = 'PAGE_DOWN';
        this.keys[35] = 'END';
        this.keys[36] = 'HOME';
        this.keys[37] = 'LEFT';
        this.keys[38] = 'UP';
        this.keys[39] = 'RIGHT';
        this.keys[40] = 'DOWN';
        this.keys[44] = 'PRINT_SCREEN';
        this.keys[45] = 'INSERT';
        this.keys[46] = 'DELETE';
        this.keys[48] = 'ZERO';
        this.keys[49] = 'ONE';
        this.keys[50] = 'TWO';
        this.keys[51] = 'THREE';
        this.keys[52] = 'FOUR';
        this.keys[53] = 'FIVE';
        this.keys[54] = 'SIX';
        this.keys[55] = 'SEVEN';
        this.keys[56] = 'EIGHT';
        this.keys[57] = 'NINE';
        this.keys[65] = 'A';
        this.keys[66] = 'B';
        this.keys[67] = 'C';
        this.keys[68] = 'D';
        this.keys[69] = 'E';
        this.keys[70] = 'F';
        this.keys[71] = 'G';
        this.keys[72] = 'H';
        this.keys[73] = 'I';
        this.keys[74] = 'J';
        this.keys[75] = 'K';
        this.keys[76] = 'L';
        this.keys[77] = 'M';
        this.keys[78] = 'N';
        this.keys[79] = 'O';
        this.keys[80] = 'P';
        this.keys[81] = 'Q';
        this.keys[82] = 'R';
        this.keys[83] = 'S';
        this.keys[84] = 'T';
        this.keys[85] = 'U';
        this.keys[86] = 'V';
        this.keys[87] = 'W';
        this.keys[88] = 'X';
        this.keys[89] = 'Y';
        this.keys[90] = 'Z';
        this.keys[96] = 'NUM_ZERO';
        this.keys[97] = 'NUM_ONE';
        this.keys[98] = 'NUM_TWO';
        this.keys[99] = 'NUM_THREE';
        this.keys[100] = 'NUM_FOUR';
        this.keys[101] = 'NUM_FIVE';
        this.keys[102] = 'NUM_SIX';
        this.keys[103] = 'NUM_SEVEN';
        this.keys[104] = 'NUM_EIGHT';
        this.keys[105] = 'NUM_NINE';
        this.keys[106] = 'NUM_MULTIPLY';
        this.keys[107] = 'NUM_PLUS';
        this.keys[109] = 'NUM_MINUS';
        this.keys[110] = 'NUM_PERIOD';
        this.keys[111] = 'NUM_DIVISION';
        this.keys[112] = 'F1';
        this.keys[113] = 'F2';
        this.keys[114] = 'F3';
        this.keys[115] = 'F4';
        this.keys[116] = 'F5';
        this.keys[117] = 'F6';
        this.keys[118] = 'F7';
        this.keys[119] = 'F8';
        this.keys[120] = 'F9';
        this.keys[121] = 'F10';
        this.keys[122] = 'F11';
        this.keys[123] = 'F12';

        window.addEventListener('keydown', this.keydown.bind(this), false);
        window.addEventListener('keyup', this.keyup.bind(this), false);
    },

    /**
        @method keydown
    **/
    keydown: function(event) {
        if(game.Keyboard.preventDefault) event.preventDefault();

        if(!this.keys[event.keyCode]) return; // unkown key
        if(this.keysDown[this.keys[event.keyCode]]) return; // key already down

        this.keysDown[this.keys[event.keyCode]] = true;
        if(game.scene) game.scene.keydown(this.keys[event.keyCode]);
    },

    /**
        @method keyup
    **/
    keyup: function(event) {
        if(game.Keyboard.preventDefault) event.preventDefault();
        
        this.keysDown[this.keys[event.keyCode]] = false;
        if(game.scene) game.scene.keyup(this.keys[event.keyCode]);
    },

    /**
        Check if key is pressed down.
        @method down
        @return {Boolean}
    **/
    down: function(key) {
        return (this.keysDown[key]);
    }
});

/**
    Prevent default keyboard action.
    @attribute {Boolean} preventDefault
    @default false
**/
game.Keyboard.preventDefault = false;

game.keyboard = new game.Keyboard();

});