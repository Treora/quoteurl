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
