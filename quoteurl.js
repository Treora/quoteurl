// Activate bidirectional support for quote-selectors in URLs.
// A quote in a URL fragment identifier is highlighted in the page (= dereferencing),
// and when text is selected it is quoted in the URL (= referencing).

var Tracker = require('trackr');

var Referencing = require('./referencing');
var Dereferencing = require('./dereferencing');

// Enable referencing: Update URL#hash whenever user selects text.
Referencing.enabled.set(true);

// Enable dereferencing whenever referencing is inactive: Highlight and scroll
// whenever URL#hash changes, unless it was changed by the user's own action.
Tracker.autorun(function () {
    var enableDereferencing = !Referencing.active.get();
    Dereferencing.enabled.set(enableDereferencing);
    if (enableDereferencing) {
        // Highlight current quote, and scroll only if it was not made by the user (= on initial load).
        var scroll = Tracker.currentComputation.firstRun;
        Dereferencing.runOnce({scroll: scroll});
    }
});

// Give highlights a yellow background by default.
(function setDefaultHighlightStyle() {
    var stylesheet = document.createElement('style');
    stylesheet.innerHTML = '.highlighted-by-url {background-color: yellow;}';
    document.head.appendChild(stylesheet);
})();
