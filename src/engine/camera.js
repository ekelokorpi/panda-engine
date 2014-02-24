game.module(
    'engine.camera'
)
.require(
    'engine.tween'
)
.body(function() {
    
game.Camera = game.Class.extend({
    container: null,
    target: null,
    position: null,
    offset: null,
    limit: null,
    panSpeed: 70,
    panLimit: 120,
    easing: game.Tween.Easing.Quadratic.Out,

    init: function() {
        this.position = new game.Vector();
        this.offset = new game.Vector();
        this.limit = new game.Vector();
    },

    follow: function(target) {
        this.target = target;
        this.set(target.position.x, target.position.y);
    },

    set: function(x, y) {
        this.position.x = x;
        this.position.y = y;
        this.container.position.x = -this.position.x + this.offset.x;
        this.container.position.y = -this.position.y + this.offset.y;
    },

    pan: function(x, y) {
        if(x < this.offset.x) x = this.offset.x;
        if(y < this.offset.y) y = this.offset.y;
        if(this.limit.x > 0 && x > this.limit.x - this.offset.x) x = this.limit.x - this.offset.x;
        if(this.limit.y > 0 && y > this.limit.y - this.offset.y) y = this.limit.y - this.offset.y;

        var dist = game.Math.distance(this.position.x, this.position.y, x, y);
        if(dist < this.panLimit) return;
        var speed = dist / (this.panSpeed / 1000);

        if(this.tween) this.tween.stop();
        this.tween = new game.Tween(this.position)
            .to({x:x, y:y}, speed)
            .easing(this.easing)
            .start();
    },

    update: function() {
        if(this.container) {
            this.container.position.x = -this.position.x + this.offset.x;
            this.container.position.y = -this.position.y + this.offset.y;
        }
    }
});

});