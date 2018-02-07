var swash = {
  docReadyFuncs:[],
  init: function() {
    this.doDocumentReady();
  },
  onDocumentReady: function(fn) {
    this.docReadyFuncs.push(fn);
  },
  doDocumentReady: function() {
    for (idx in this.docReadyFuncs) {
      var fn = this.docReadyFuncs[idx];
      if (typeof fn === "function") fn();
    }
  }
}

window.onload = function() { swash.init(); }