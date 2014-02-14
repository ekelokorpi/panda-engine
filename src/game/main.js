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

game.System.hires = true;
game.System.retina = true;

game.start();

});