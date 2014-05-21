/**
    @module storage
    @namespace game
**/
game.module(
    'engine.storage'
)
.body(function() {
'use strict';

/**
    Local storage.
    @class Storage
    @extends game.Class
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
        @param {String|Object} value
    **/
    set: function(key, value) {
        localStorage[this.id + '.' + key] = this.encode(value);
    },

    /**
        Get key from local storage.
        @method get
        @param {String} key
        @return {String} value
    **/
    get: function(key) {
        return this.decode(localStorage[this.id + '.' + key]);
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
        for (var i in localStorage) {
            if (i.indexOf(this.id + '.') !== -1) localStorage.removeItem(i);
        }
    },

    encode: function(obj) {
        if (typeof obj === 'object') return JSON.stringify(obj);
        return obj;
    },

    decode: function(str) {
        if (typeof str === 'undefined') return;
        if (str.indexOf('{') === 0) return JSON.parse(str);
        return str;
    }
});

/**
    @attribute {String} id
**/
game.Storage.id = '';

});
