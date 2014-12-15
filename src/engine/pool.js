/**
    @module pool
    @namespace game
**/
game.module(
    'engine.pool'
)
.body(function() {
'use strict';

/**
    Object pool.
    @class Pool
    @extends game.Class
**/
game.createClass('Pool', {
    /**
        Create new pool.
        @method create
        @param {String} pool Name of the pool.
        @return {Boolean} Returns false, if pool already exists.
    **/
    create: function(pool) {
        if (!this[pool]) {
            this[pool] = [];
            return true;
        }
        return false;
    },

    /**
        Get object from pool.
        @method get
        @param {String} pool Name of the pool.
        @return {Object} Returns false, if pool not found or empty.
    **/
    get: function(pool) {
        if (!this[pool] || this[pool].length === 0) return false;
        else return this[pool].pop();
    },

    /**
        Put object to pool.
        @method put
        @param {String} pool Name of the pool.
        @param {Object} object Object to put to the pool.
        @return {Boolean} Returns false, if pool not found.
    **/
    put: function(pool, object) {
        if (!this[pool]) return false;
        this[pool].push(object);
        return true;
    }
});
    
});
