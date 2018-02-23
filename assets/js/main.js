var swash = {
  docReadyFuncs:[],
  init: function() {
    this.doDocumentReady();
    this.fixTargets();
  },
  onDocumentReady: function(fn) {
    this.docReadyFuncs.push(fn);
  },
  doDocumentReady: function() {
    for (idx in this.docReadyFuncs) {
      var fn = this.docReadyFuncs[idx];
      if (typeof fn === "function") fn();
    }
  },
  fixTargets: function() {
    const links = document.querySelectorAll('a');
    Array.from(links).forEach(function(a){
      const href = a.getAttribute('href');
      if (href.indexOf(window.location.host) < 0 && href.indexOf('http') == 0) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noreferrer noopener');
      }
    });
  }
}

window.onload = function() { swash.init(); }