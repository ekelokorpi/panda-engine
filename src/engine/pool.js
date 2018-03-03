/**
    @module pool
**/
game.module(
    'engine.pool'
)
.body(function() {

/**
    Pool manager. Instance automatically created at `game.pool`
    @class Pool
**/
game.createClass('Pool', {
    /**
        @property {Object} pools
    **/
    pools: {},

    /**
        Create new pool.
        @method create
        @param {String} pool Name of the pool.
        @return {Boolean} Returns false, if pool already exists.
    **/
    create: function(pool) {
        if (!this.pools[pool]) {
            this.pools[pool] = [];
            return true;
        }
        return false;
    },

    /**
        Get object from pool.
        @method get
        @param {String} pool Name of the pool.
        @return {Object}
    **/
    get: function(pool) {
        if (this.pools[pool] && this.pools[pool].length) {
            return this.pools[pool].pop();
        }
    },

    /**
        Put object to pool.
        @method put
        @param {String} pool Name of the pool.
        @param {Object} object Object to put to the pool.
        @return {Boolean} Returns false, if pool not found.
    **/
    put: function(pool, object) {
        if (!this.pools[pool]) return false;
        this.pools[pool].push(object);
        return true;
    }
});
    
});
