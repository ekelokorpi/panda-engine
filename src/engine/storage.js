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
game.createClass('Storage', {
    init: function(id) {
        this.id = id || game.Storage.id;
        this.supported = this.isSupported();
    },

    isSupported: function() {
        if (typeof localStorage !== 'object') return false;
        try {
            localStorage.setItem('localStorage', 1);
            localStorage.removeItem('localStorage');
        }
        catch (e) {
            return false;
        }
        return true;
    },

    /**
        Set value to local storage.
        @method set
        @param {String} key
        @param {*} value
    **/
    set: function(key, value) {
        if (!this.supported) return false;
        localStorage.setItem(this.id + '.' + key, this.encode(value));
    },

    /**
        Get key from local storage.
        @method get
        @param {String} key
        @param {*} [defaultValue]
        @return {*} value
    **/
    get: function(key, defaultValue) {
        var raw = localStorage.getItem(this.id + '.' + key);
        if (raw === null) return defaultValue;
        try {
            return this.decode(raw);
        }
        catch (e) {
            return raw;
        }
    },

    /**
        Check if a key is in local storage.
        @method has
        @param {String} key
        @return {Boolean}
    **/
    has: function(key) {
        return localStorage.getItem(this.id + '.' + key) !== null;
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
        for (var i = localStorage.length - 1; i >= 0; i--) {
            var key = localStorage.key(i);
            if (key.indexOf(this.id + '.') !== -1) localStorage.removeItem(key);
        }
    },

    encode: function(val) {
        return JSON.stringify(val);
    },

    decode: function(str) {
        return JSON.parse(str);
    }
});

game.addAttributes('Storage', {
    /**
        @attribute {String} id
    **/
    id: ''
});

});
