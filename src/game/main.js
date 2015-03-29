game.module(
    'game.main'
)
.body(function() {

game.addAsset('panda.png');

game.createClass('Panda', 'Sprite', {
    texture: 'panda.png',

    init: function() {
        this.anchor.set(this.width / 2, this.height / 2);
        this.position.set(game.system.width.random(), game.system.height.random());
        this.addTo(game.scene.stage);
    },

    update: function() {
        this.rotation += 1 * game.system.delta;
    }
});

game.createScene('Main', {
    init: function() {
        for (var i = 0; i < 1000; i++) {
            var panda = new game.Panda();
        }
    }
});

});
