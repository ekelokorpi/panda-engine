/**
    @module camera
**/
game.module(
    'engine.camera'
)
.body(function() {

/**
    @class Camera
    @constructor
    @param {Container} [target]
**/
game.createClass('Camera', {
    /**
        Camera acceleration speed. Higher is faster.
        @property {Number} acceleration
        @default 3
    **/
    acceleration: 3,
    /**
        Limit the camera movement.
        @property {Rectangle} limit
        @default Infinity
    **/
    limit: null,
    /**
        Camera maximum move speed.
        @property {Number} maxSpeed
        @default 200
    **/
    maxSpeed: 200,
    /**
        Camera offset.
        @property {Vector} offset
        @default game.width / 2, game.height / 2
    **/
    offset: null,
    /**
        Current position of the camera.
        @property {Vector} position
    **/
    position: null,
    /**
        Round camera position.
        @property {Boolean} rounding
        @default false
    **/
    rounding: false,
    /**
        Position of the camera sensor.
        @property {Vector} sensorPosition
    **/
    sensorPosition: null,
    /**
        Size of the camera sensor.
        @property {Vector} sensorSize
        @default 200
    **/
    sensorSize: null,
    /**
        Current speed of camera.
        @property {Vector} speed
    **/
    speed: null,
    /**
        @property {Number} threshold
    **/
    threshold: 1,
    /**
        Container, that the camera is moving.
        @property {Container} container
        @private
    **/
    _container: null,
    /**
        Container, that camera follows.
        @property {Container} target
        @private
    **/
    _target: null,
    
    staticInit: function(target) {
        this.limit = new game.Rectangle(Infinity, Infinity, -Infinity, -Infinity);
        this.position = new game.Vector();
        this.speed = new game.Vector();
        this.offset = new game.Vector(game.width / 2, game.height / 2);
        this.sensorPosition = new game.Vector(this.offset.x, this.offset.y);
        this.sensorSize = new game.Vector(200);
        if (target) this.setTarget(target);
    },

    /**
        Add camera to container.
        @method addTo
        @param {Container} container
        @chainable
    **/
    addTo: function(container) {
        this._container = container;
        this._container.position.set(-this.position.x, -this.position.y);
        this._setSensorPosition();
        return this;
    },

    /**
        Set container, that the camera follows.
        @method setTarget
        @param {Container} target
    **/
    setTarget: function(target) {
        this._target = target;
        this._setSensorPosition();
    },

    /**
        Set camera position.
        @method setPosition
        @param {Number|Vector|Container} x
        @param {Number} [y]
    **/
    setPosition: function(x, y) {
        if (x instanceof game.Vector || x instanceof game.Container) {
            y = x.y;
            x = x.x;
        }

        if (this._container) {
            x *= this._container.scale.x;
            y *= this._container.scale.y;
        }
        
        this._setPosition(x, y);
    },

    /**
        Update camera position.
        @method update
    **/
    update: function() {
        this._moveSensor();
        this._moveCamera();
    },

    /**
        @method _moveCamera
        @private
    **/
    _moveCamera: function() {
        this.speed.x = (this.position.x - this.sensorPosition.x + this.offset.x).limit(-this.maxSpeed, this.maxSpeed);
        this.speed.y = (this.position.y - this.sensorPosition.y + this.offset.y).limit(-this.maxSpeed, this.maxSpeed);

        if (this.speed.x > this.threshold ||
            this.speed.x < -this.threshold ||
            this.speed.y > this.threshold ||
            this.speed.y < -this.threshold
        ) {
            this._setPosition(
                this.position.x + this.offset.x - this.speed.x * this.acceleration * game.delta,
                this.position.y + this.offset.y - this.speed.y * this.acceleration * game.delta
            );
        }
        else {
            this.speed.set(0, 0);
        }
    },

    /**
        @method _moveSensor
        @private
    **/
    _moveSensor: function() {
        if (!this._target || !this._container) return;

        var targetWidth = this._target.width * this._container.scale.x;
        var targetHeight = this._target.height * this._container.scale.y;
        var targetPosX = (this._target.position.x - this._target.anchor.x + this._target.width / 2 * this._target.scale.x) * this._container.scale.x;
        var targetPosY = (this._target.position.y - this._target.anchor.y + this._target.height / 2 * this._target.scale.y) * this._container.scale.y;
        
        if (this.sensorSize.x < targetWidth || this.sensorSize.y < targetHeight) this.sensorSize.set(targetWidth, targetHeight);

        if (targetPosX < this.sensorPosition.x - this.sensorSize.x / 2 + targetWidth / 2) {
            this.sensorPosition.x = targetPosX + this.sensorSize.x / 2 - targetWidth / 2;
        }
        else if (targetPosX + (this.sensorSize.x / 2 + targetWidth / 2) > this.sensorPosition.x + this.sensorSize.x) {
            this.sensorPosition.x = targetPosX + (this.sensorSize.x / 2 + targetWidth / 2) - this.sensorSize.x;
        }

        if (targetPosY < this.sensorPosition.y - this.sensorSize.y / 2 + targetHeight / 2) {
            this.sensorPosition.y = targetPosY + this.sensorSize.y / 2 - targetHeight / 2;
        }
        else if (targetPosY + (this.sensorSize.y / 2 + targetHeight / 2) > this.sensorPosition.y + this.sensorSize.y) {
            this.sensorPosition.y = targetPosY + (this.sensorSize.y / 2 + targetHeight / 2) - this.sensorSize.y;
        }
    },

    /**
        @method _setPosition
        @param {Number} x
        @param {Number} y
        @private
    **/
    _setPosition: function(x, y) {
        this.position.set(x - this.offset.x, y - this.offset.y);

        if (this.position.x < this.limit.x) {
            this.position.x = this.limit.x;
            this.speed.x = 0;
        }
        else if (this.position.x > this.limit.width) {
            this.position.x = this.limit.width;
            this.speed.x = 0;
        }
        if (this.position.y < this.limit.y) {
            this.position.y = this.limit.y;
            this.speed.y = 0;
        }
        else if (this.position.y > this.limit.height) {
            this.position.y = this.limit.height;
            this.speed.y = 0;
        }

        if (this._container) {
            this._container.position.x = -(this.rounding ? (this.position.x + 0.5) | 0 : this.position.x);
            this._container.position.y = -(this.rounding ? (this.position.y + 0.5) | 0 : this.position.y);
        }
    },

    /**
        @method _setSensorPosition
        @private
    **/
    _setSensorPosition: function() {
        if (!this._target || !this._container) return;
        var targetPosX = (this._target.position.x - this._target.anchor.x + this._target.width / 2 * this._target.scale.x) * this._container.scale.x;
        var targetPosY = (this._target.position.y - this._target.anchor.y + this._target.height / 2 * this._target.scale.y) * this._container.scale.y;
        this.sensorPosition.set(targetPosX, targetPosY);
    }
});

});
