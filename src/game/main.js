game.module(
    'game.main'
)
.body(function() {

game.addAsset('panda.png');

game.createScene('Main', {
    init: function() {
        var container = new game.Container().addTo(this.stage);

        var panda = new game.Sprite('panda.png');
        panda.position.set(100, 100);
        panda.addTo(container);
        var panda = new game.Sprite('panda.png');
        panda.position.set(400, 350);
        panda.addTo(container);

        var panda = new game.Sprite('panda.png');
        panda.anchor.x = panda.width / 2;
        panda.anchor.y = panda.height / 2;
        panda.center(container);
        panda.addTo(container);
        this.panda = panda;
    },

    mousemove: function(x, y) {
    },

    update: function() {
    	this.panda.rotation += 1 * game.system.delta;
    }
});

});
