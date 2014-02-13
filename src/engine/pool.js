/**
    Object pooling.

    @module pool
    @namespace game
**/
game.module(
    'engine.pool'
)
.body(function() { 'use strict';

/**
    Instance automatically created at {{#crossLink "game.Core"}}{{/crossLink}}
    @class Pool
    @extends game.Class
**/
game.Pool = game.Class.extend({
    /**
        Create new pool.
        @method create
        @param {String} pool
        @return {Boolean} Returns false, if pool already exists.
    **/
    create: function(pool) {
        if(!this[pool]) {
            this[pool] = [];
            return true;
        }
        return false;
    },

    /**
        Get object from pool.
        @method get
        @param {String} pool
        @return {Object} Returns false, if pool not found or empty.
    **/
    get: function(pool) {
        if(!this[pool] || this[pool].length === 0) return false;
        else return this[pool].pop();
    },

    /**
        Put object to pool.
        @method put
        @param {String} pool
        @param {Object} item
        @return {Boolean} Returns false, if pool not found.
    **/
    put: function(pool, item) {
        if(!this[pool]) return false;
        this[pool].push(item);
        return true;
    }
});
    
});