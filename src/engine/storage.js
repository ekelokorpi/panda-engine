/**
    @module storage
**/
game.module(
    'engine.storage'
)
.body(function() {

/**
    Local storage manager. Instance automatically created at `game.storage`, when `Storage.id` is defined
    @class Storage
    @constructor
    @param {String} [id]
**/
game.createClass('Storage', {
    /**
        @property {String} id
    **/
    id: '',
    /**
        Is local storage supported.
        @property {Boolean} supported
    **/
    supported: false,

    init: function(id) {
        this.id = id || game.Storage.id;
        this.supported = this._isSupported();
    },

    /**
        Clear storage. This removes ALL keys.
        @method clear
    **/
    clear: function() {
        for (var i = localStorage.length - 1; i >= 0; i--) {
            var key = localStorage.key(i);
            if (key.indexOf(this.id + '.') !== -1) localStorage.removeItem(key);
        }
    },

    /**
        Get value from storage.
        @method get
        @param {String} key
        @param {*} [defaultValue]
        @return {*} value
    **/
    get: function(key, defaultValue) {
        var val = localStorage.getItem(this.id + '.' + key);
        if (val === null) return defaultValue;
        try {
            return this._decode(val);
        }
        catch (e) {
            return val;
        }
    },

    /**
        Check if a key exists in storage.
        @method has
        @param {String} key
        @return {Boolean}
    **/
    has: function(key) {
        return localStorage.getItem(this.id + '.' + key) !== null;
    },

    /**
        Remove key from storage.
        @method remove
        @param {String} key
    **/
    remove: function(key) {
        localStorage.removeItem(this.id + '.' + key);
    },

    /**
        Set value to storage.
        @method set
        @param {String} key
        @param {*} value
        @return {*} value
    **/
    set: function(key, value) {
        if (this.supported) localStorage.setItem(this.id + '.' + key, this._encode(value));
        return value;
    },

    /**
        @method _decode
        @private
    **/
    _decode: function(str) {
        return JSON.parse(str);
    },

    /**
        @method _encode
        @private
    **/
    _encode: function(val) {
        return JSON.stringify(val);
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
