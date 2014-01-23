game.module(
    'engine.storage',
    '1.0.0'
)
.body(function() { 'use strict';

game.Storage = game.Class.extend({
    id: null,

    init: function(id) {
        this.id = id;
    },

    set: function(key, value) {
        localStorage[this.id + '.' + key] = value;
    },

    get: function(key) {
        return localStorage[this.id + '.' + key];
    },

    remove: function(key) {
        localStorage.removeItem(this.id + '.' + key);
    },

    reset: function() {
        for(var i in localStorage) {
            if(i.indexOf(this.id+'.') !== -1) localStorage.removeItem(i);
        }
    }
});

game.Storage.id = null;

});