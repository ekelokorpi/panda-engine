game.module(
    'game.main'
)
.require(
    'engine.core',
    'game.assets',
    'game.objects',
    'game.scenes'
)
.body(function(){

game.System.orientation = 1;
game.System.canvas = false;

game.start();

});