game.module(
    'engine.storage',
    '1.0.0'
)
.body(function() { 'use strict';

/**
    Automatically created at `game.storage` if `game.Storage.id` is set.

        game.Storage.id = 'com.company.mygame';

        game.storage.set('highScore', 1000);
        var highScore = game.storage.get('highscore');
    @class Storage
**/
game.Storage = game.Class.extend({
    id: null,

    init: function(id) {
        this.id = id;
    },

    /**
        Set value to local storage.
        @method set
        @param {String} key
        @param {String} value
    **/
    set: function(key, value) {
        localStorage[this.id + '.' + key] = value;
    },

    /**
        Get key from local storage.
        @method get
        @param {String} key
    **/
    get: function(key) {
        return localStorage[this.id + '.' + key];
    },

    /**
        Remove key from local storage.
        @method remove
        @param {String} key
    **/
    remove: function(key) {
        localStorage.removeItem(this.id + '.' + key);
    },

    /**
        Reset local storage. This removes ALL keys.
        @method reset
    **/
    reset: function() {
        for(var i in localStorage) {
            if(i.indexOf(this.id+'.') !== -1) localStorage.removeItem(i);
        }
    }
});

/**
    Id for local storage.
    @attribute {String} id
**/
game.Storage.id = null;

});