function init() {
  var colors = ['blue', 'yellow', 'red'];
  var fps = document.getElementsByClassName('featured-project');
  for(var i = 0; i < fps.length; i++) {
    var color = colors[Math.floor(Math.random() * colors.length)];
    fps[i].classList.add(color);
  }
}

if (!window.onloadfuncs) window.onloadfuncs = [];
window.onloadfuncs.push(init);