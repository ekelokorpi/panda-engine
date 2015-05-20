/**
    @module storage
**/
game.module(
    'engine.storage'
)
.body(function() {

/**
    Local storage.
    @class Storage
    @constructor
    @param {String} id
**/
game.createClass('Storage', {
    /**
        @property {String} id
    **/
    id: null,
    /**
        Is local storage supported.
        @property {Boolean} supported
    **/
    supported: null,

    init: function(id) {
        this.id = id || game.Storage.id;
        this.supported = this._isSupported();
    },

    /**
        Set value to local storage.
        @method set
        @param {String} key
        @param {*} value
    **/
    set: function(key, value) {
        if (!this.supported) return false;
        localStorage.setItem(this.id + '.' + key, this._encode(value));
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
            return this._decode(raw);
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

    /**
        @method _encode
        @private
    **/
    _encode: function(val) {
        return JSON.stringify(val);
    },

    /**
        @method _decode
        @private
    **/
    _decode: function(str) {
        return JSON.parse(str);
    },

    /**
        @method _isSupported
        @private
    **/
    _isSupported: function() {
        if (typeof localStorage !== 'object') return false;
        try {
            localStorage.setItem('localStorage', 1);
            localStorage.removeItem('localStorage');
        }
        catch (e) {
            return false;
        }
        return true;
    }
});

game.addAttributes('Storage', {
    /**
        @attribute {String} id
    **/
    id: ''
});

});
