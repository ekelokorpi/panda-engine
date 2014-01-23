game.module(
    'engine.pool',
    '1.0.0'
)
.body(function() { 'use strict';

game.Pool = game.Class.extend({
    create: function(pool) {
        if(!this[pool]) {
            this[pool] = [];
            return true;
        }
        return false;
    },

    get: function(pool) {
        if(!this[pool] || this[pool].length === 0) return null;
        else return this[pool].pop();
    },

    put: function(pool, item) {
        if(!this[pool]) return false;
        this[pool].push(item);
        return true;
    }
});
    
});