game.module(
    'game.main'
)
.require(
    'engine.core'
)
.body(function() {

game.addAsset('logo.png', 'logo');

SceneGame = game.Scene.extend({
    backgroundColor: 0x808080,

    init: function() {
        var logo = new game.Sprite('logo');
        logo.anchor.set(0.5, 0.5);
        logo.position.set(game.system.width / 2, game.system.height / 2);
        this.stage.addChild(logo);
    }
});

game.start();

});