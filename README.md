# Panda Engine

### HTML5 game engine for mobile and desktop

Make games written in [JavaScript](http://www.w3schools.com/js/), play them on any major browser, or wrap them into native applications.

## Install

1. Download latest [Panda Engine](https://github.com/ekelokorpi/panda.js/archive/master.zip) zip
2. Install local [web server](https://www.google.com/search?q=install%20local%20web%20server&rct=j)
3. Unzip and open `dev.html` in your browser

## Example

Short example on how the game code looks:

```javascript
game.addAsset('logo.png');

game.createScene('Main', {
    backgroundColor: 0xb9bec7,

    init: function() {
        var logo = new game.Sprite('logo.png');
        logo.addTo(this.stage);
    }
});
```

## Features

- Canvas / WebGL
	- Pixi.js powered rendering with super fast speed
- Particle engine
	- Create stunning special effects using particles
- Tweening
	- Tween anything with easing, looping and grouping
- Physics engine
	- Hit detection and response with different shapes
- Timers
	- Add timers with callback functions and repeating
- Mobile support
	- Make games for mobile and tablet devices
- Sound manager
	- Play sound effects and music in your game
- Modules
	- Keep your code organized using modules

## Documentation

[API Documentation](http://www.pandajs.net/engine/docs)

## Support

Join the discussion at official [Panda.js forum](http://www.html5gamedevs.com/forum/19-pandajs/).

