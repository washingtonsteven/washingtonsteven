---
layout: post
title: Playing with Canvas and ES6 Classes
published: true
subtitle: Getting to know ES6 classes while also making a tiny game!
date: 2017-09-09
tags: javascript, canvas, es6, devlog
---

## A Train Ride

This past Labor Day weekend I took some time to take the train down to New York City with my wife to see the sights, eat some good food, and generally get incredibly overwhelmed by the sheer *denseness* of the city. It's a great city and I know many people love it, but it's more and more becoming not my style. However on the way back I was actually awake enough to run through [a quick tutorial][1] on how to use the HTML5 Canvas API to draw to the screen, take in inputs and output a simple, single-screen platformer game. Nothing to write home about, but it was nice to get away from the libraries like [Pixi][2] and [CreateJS][3] and just get your hands dirty directly.

## A New Challenge

The tutorial (linked above) turned out to be from 2013. Flipping through it, the javascript necessary to power the simple app was fairly straightforward, and the tutorial was less a lesson in Javascript and more a lesson in simple game programming: concepts of player variables, modeling the loop in memory then drawing it, and collisions (box-based, but still) were all covered. As someone with some experience building similar systems in Unity, this wasn't anything particularly new. But that Unity knowledge would drive me to update the code in this tutorial for something that is very useful in Unity's use of C#, and just about every other language except Javascript, until recently that is.

## ES6 Classes

The tutorial keeps all of the game state in the global `window` object. Various other objects (like a `player` object, or `boxes` array) are top level, while items like handling input are added directly as needed. As a person that's constantly interested in keeping a clean and semantic codebase, I took the 3.5 hour ride (we were lucky enough to get Acela tickets) to try to refactor what the original author had done.

#### Code

Follow along with the code [on Github][4]. I don't repeat every line here, so go check the full thing out! (Link goes to the specific commit that this post is referencing, since I will be updating it in the future).

### Main class

I started off with a main class, that really just kicked everything off. I've had a habit of doing something like:

```javascript
    $(document).ready(function() {
      main.init();
    });
    var main = {
      init:function() {
        // actually do stuff here
      }
    };
```    

It kept things out of the global scope, at least. But not nearly ES6-y enough. Also...still relying on jQuery? [That's so 2010][5]. Now we can shed that pile of bloat<sup><a href="#jquery-disclaimer">1</a></sup> and in a fairly easy-to-read way setup our main starter class: the `public static void main(String [] args)` of Javascript.

```javascript
    class CVS { //CVS is short for canvas, not a convenience store/pharmacy
      constructor() {
        // actually do stuff here
      }  
    }
    
    (function() {
      let cvs = new CVS();
    })();
```
    

### Browserify

Javascript isn't great about sharing resources between files. At least in the browser, you either need to concatenate all your work into a single file (which you should do for production, but is a pain in dev), or add a bunch of `<script>` tags (for those who really don't care about HTTP requests). Fortunately, you can work in separate files and a huge number of packages (`gulp`, `browserify`, and `webpack`, to name a few) will do all the concatenating work for you. What's even better is that with some you can even declare which files you want to use in Javascript itself, with the use of modules. All you need is a `require` and boom, you have resources from another file.

### Player class

For example, the `Player` should have its own class where it can keep track of it's own variables (position, velocity, and size, among others). For sanity's sake, we will separate that out into a separate file to keep the code base organized (and prevent collisions in scm). Luckily ES6 gives us a default (*fingerguns*) way to expose a class

#### player.js

```javascript
    class Player {
      constructor() {
        this.x = 0; this.y = 0; //etc., etc.
      }
    
      move(horizontal, vertical) {
        // given the horizontal and vertical input directions, move the player in this frame by updating this.x and this.y
      }
    
      draw(ctx) {
        // Given a canvas 2d context, draw the player at the current position (this.x, this.y). 
        // For simplicity's sake, this player is a square and we can use the canvas rect() function
      }
    }
    
    export default Player;
```
    

That last line is the magic<sup><a href="#es6imports">2</a></sup>. We now can export the class (which is actually a function, since `class` is just syntactic sugar for JS prototypical "class" definition, and not truly a "new" spec.

### Collisions! (util.js)

It's hard to have a game without checking for collisions! The end of `util.js` (which isn't really a class, just an object with a collection of functions) has some basic math for checking for collisions between two objects. I won't go into the math of it (the tutorial linked above does a good job of that). But it can detect if two objects have collided as long as both can describe a rectangle, that is, they have an `x` and `y` position, and `width` and `height`.

### Other classes

#### input.js

Having an input class (which basically is a Singleton, like Player above), is useful to send input events to the appropriate place. The Player doesn't need to know anything about what keys were pressed, just what direction we need to go! So we abstract that away from them. This even allows the flexibility to swap out what kind of inputs we are using: keyboard, mouse, Wiimote, and even mind control<sup><a href="#mind-control">3</a></sup> are all possible!

```javascript
    class Input {
      constructor(docBody) { //pass in a reference to document.body
        this.keys = [];
        docBody.addEventListener('keydown', (e) => { this.keys[e.keyCode] = true });
        docBody.addEventListener('keyup', (e) => { this.keys[e.keyCode] = false });
      }
    }
```
    

This is the meat of `Input`. An array keeps track of which keys are pressed. And anyone with access to an Input instance can just check `Input.keys` and see what keys are pressed at any given moment. Any other functions on this class (for now) are just fluff to make checking easier.

As I'm writing this, I realize that an update for this is to make Input a true singleton. Right now you can have multiple versions of this class which can be a mess. For the most part, I think you'd only need one.

#### platform.js and level.js (and coin.js!)

`Platform` is basically a glorified rectangle with a `draw` function. Pass it a canvas context and it'll draw a `rect` onto it with it's own internal state (`x`, `y`, `width`, and `height`). Coins are the same, except they are circles, and have a `collected` state that will gray them out the next time they are drawn.

`Level` is a collection of platforms. If you tell a level to draw itself, it just passes on the command to it's array of platforms (and coins).

#### (The rest of) util.js

The rest of util has some nice helper functions to get us through the hard times (and keeping things DRY)

*   `normalize(num)`: Sometimes, we don't care about the value of a variable, just whether it is less than zero, zero or greater than zero. Here's a quickie to do that. (Don't tell me, there's a `Math` function that already does this in Javascript)
*   `clamp(num, min, max)`: Instead of having boundary checks everywhere, here we can just pass a number in, and either get that number back, or `min` if it's less than `min` or `max` if it's less than `max`. In addition there's some simple checks so that `min` and `max` can be passed in any order, and if you only pass a single boundary, it will assume that that is `max` and `min` is negative `max`.
*   `not(o)`: Just a simple way to check for existence without having to weed out 'falsy' values each time.
*   `objectHasAllProps(o, props)` (and `objectsHaveAllProps`): Just used for `collide`, it's something of a type checker in a language where types don't exist ¯\\\_(ツ)_/¯. Added a plural version because.

### Round 2, start!

So that's the first pass at it (at least a brief overview, anyway). It was a lot of fun to go through and make this work with this new tool I'm learning about! The next step is implementing more complex levels, possibly getting out of the drawing API and working with actual images, and throwing it all away and just using a canvas library like Pixi.js because I ain't got time to write my own.

Once again, follow the code (at the time of this post) [on Github][4]

* * *

<a name="jquery-disclaimer">1.</a> jQuery has it's uses, of course. But I always try to see how long I can go before having to use it.

<a name="es6imports">2.</a> Tools like [Babel][6] have made exporting/importing variables weird, since Babel < 6.0 suppressed errors for some technically invalid code. [Read more here.][7]

<a name="mind-control">3.</a> Mind Control API coming ~2020?

 [1]: http://www.somethinghitme.com/2013/01/09/creating-a-canvas-platformer-tutorial-part-one/
 [2]: http://www.pixijs.com/
 [3]: http://createjs.com/
 [4]: https://github.com/washingtonsteven/js-canvas-platformer/tree/95927ec3ff837ff3128472370b3b9f7b48464341
 [5]: https://meta.stackoverflow.com/questions/335328/when-is-use-jquery-not-a-valid-answer-to-a-javascript-question
 [6]: https://babeljs.io/
 [7]: https://medium.com/@kentcdodds/misunderstanding-es6-modules-upgrading-babel-tears-and-a-solution-ad2d5ab93ce0