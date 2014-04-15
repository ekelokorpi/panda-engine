game.module(
    'game.main'
)
.body(function() {

game.addAsset('logo.png');

SceneGame = game.Scene.extend({
    backgroundColor: 0xb9bec7,

    init: function() {
        var logo = new game.Sprite('logo.png');
        logo.anchor.set(0.5, 0.5);
        logo.position.set(game.system.width / 2, game.system.height / 2);
        this.stage.addChild(logo);
    }
});

game.start();

});
