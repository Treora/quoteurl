// Activate bidirectional support for quote-selectors in URLs.
// A quote in a URL fragment identifier is highlighted in the page (= dereferencing),
// and when text is selected it is quoted in the URL (= referencing).

var Tracker = require('trackr');

var Referencing = require('./referencing');
var Dereferencing = require('./dereferencing');

// Enable referencing.
Referencing.enabled.set(true);

// Enable dereferencing whenever referencing is inactive.
Tracker.autorun(function () {
    Dereferencing.enabled.set( !Referencing.active.get() );
});


// Specify highlights to have a yellow background.
function setDefaultHighlightStyle() {
    var stylesheet = document.createElement('style');
    stylesheet.innerHTML = ".highlighted-by-url {background-color: yellow;}";
    document.body.appendChild(stylesheet);
}
if (['loaded', 'interactive', 'complete'].indexOf(document.readyState) > -1) {
    // Run directly if possible
    setDefaultHighlightStyle();
}
else {
    // Or run as soon as the DOM has loaded.
    window.addEventListener("load", setDefaultHighlightStyle);
}
