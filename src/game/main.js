game.module(
    'game.main'
)
.body(function() {

game.addAsset('panda.png');

game.createScene('Main', {
    sprites: [],
    gravity: 800,

    init: function() {
        this.container = new game.Container();
        this.container.interactive = true;
        this.container.mousedown = function() {
            console.log('remove all');
            this.removeAll();
        };
        this.container.addTo(this.stage);
        this.addSprites(4);
        // console.log(this.container.width, this.container.height);

        var panda = this.createSprite();
        panda.addTo(this.stage);
        this.panda = panda;
        console.log(panda._worldBounds);
    },

    mousedown: function(x, y) {
        console.log(x + ' : ' + y);
        // this.addSprite(x, y);
        // this.addSprites(500);
        // console.log(this.container.width, this.container.height);
    },

    removeAll: function() {
        this.container.removeAll();
        console.log(this.container.width, this.container.height);
    },

    addSprite: function(x, y) {
        var sprite = this.createSprite(x, y);
        sprite.addTo(this.container);
    },

    addSprites: function(count, slower) {
        this.container.removeAll();
        var sprites = [];
        var start = Date.now();
        for (var i = 0; i < count; i++) {
            var sprite = this.createSprite();
            sprites.push(sprite);
            if (slower) sprite.addTo(this.container);
        }
        if (!slower) this.container.addChilds(sprites);
        var finish = Date.now();
        var time = finish - start;
        console.log(time);
    },

    swipe: function(dir) {
        console.log(dir);
    },

    createSprite: function(x, y) {
        var sprite = new game.Sprite('panda.png');
        sprite.interactive = true;
        sprite.mousedown = function() {
            console.log('remove');
            this.remove();
        };
        sprite.speedX = Math.random() * 200 * (Math.random() > 0.5 ? 1 : -1);
        sprite.speedY = Math.random() * 200 * (Math.random() > 0.5 ? 1 : -1);
        sprite.rotationSpeed = Math.random() * 10;
        // sprite.anchor.set(sprite.width / 2, sprite.height / 2);
        sprite.anchorCenter();
        // sprite.rotation = Math.random() * Math.PI * 2;
        sprite.position.x = typeof x === 'number' ? x : sprite.width / 2 + Math.random() * (game.system.width - sprite.width);
        sprite.position.y = typeof y === 'number' ? y : sprite.height / 2 + Math.random() * (game.system.height - sprite.height);
        this.sprites.push(sprite);
        return sprite;
    },

    update: function() {
        for (var i = 0; i < this.sprites.length; i++) {
            var sprite = this.sprites[i];
            var minX = sprite.width / 2;
            var maxX = game.system.width - sprite.width / 2;
            var minY = sprite.height / 2;
            var maxY = game.system.height - sprite.height / 2;
            
            sprite.position.x += sprite.speedX * game.system.delta;
            sprite.position.y += sprite.speedY * game.system.delta;
            sprite.speedY += this.gravity * game.system.delta;
            sprite.rotation += sprite.rotationSpeed * game.system.delta;

            if (sprite.position.x >= maxX) {
                sprite.speedX *= -1;
                sprite.position.x = maxX;
            }
            else if (sprite.position.x < minX) {
                sprite.speedX *= -1;
                sprite.position.x = minX;
            }
            if (sprite.position.y > maxY) {
                sprite.speedY *= -0.85;
                sprite.position.y = maxY;
                if (Math.random() > 0.5) sprite.speedY -= Math.random() * 200;
            } 
            else if (sprite.position.y < minY) {
                sprite.speedY = 0;
                sprite.position.y = minY;
            }
        }
    }
});

});
