// Highlight the quote when one is found in the URL's fragment identifier.

var Tracker = require('trackr');
var ReactiveVar = require('trackr-reactive-var');
var TextQuoteAnchor = require('dom-anchor-text-quote');
var highlightRange = require('dom-highlight-range');

var selectorInUrl = require('./oa-selector-in-url');

// Whether module is enabled.
var enabled = new ReactiveVar(false);

// Remembers how to remove the previously set highlight.
var cleanupHighlight = null;


function onHashChange(event) {
    if (enabled.get()) {
        // Read the #hash part from the URL
        var hash = window.location.hash;

        // Ditch the '#', decode URI-escaped characters
        var fragmentIdentifier = window.decodeURIComponent(hash.substring(1, hash.length));

        // Do our thing.
        processFragmentIdentifier(fragmentIdentifier);
    }
}


function processFragmentIdentifier(fragmentIdentifier) {
    // Remove the previous highlight, if any.
    if (cleanupHighlight !== null) {
        cleanupHighlight();
        cleanupHighlight = null;
    }

    // If an OA-selector is found in the fragment identifier, highlight its target.
    var selector = selectorInUrl.selectorFromFragmentIdentifier(fragmentIdentifier);
    if (selector !== null) {
        // The actual dereferencing in the document.
        var range = rangeFromSelector(selector);
        if (range === null) {
            console.error("Could not locate the specified fragment: '" + fragmentIdentifier + "'.");
            return;
        }

        // Highlight the range.
        cleanupHighlight = highlightRange(range, 'highlighted-by-url');

        // TODO Scroll to highlight.
    }
}


function rangeFromSelector(selector) {
    // Try to find the target of the selector in the document.
    var type = selector.type;
    var range;
    if (type == 'TextQuoteSelector') {
        try {
            range = TextQuoteAnchor.fromSelector(document.body, selector).toRange();
        } catch (e) {
            return null;
        }
    }
    else {
        throw new Error("Unsupported selector type: '"+type+"'.");
    }
    return range;
}


Tracker.autorun(function () {
    // Add and remove event listeners whenever we are switched on or off
    if (enabled.get()) {
        enable();
    }
    else {
        if (!Tracker.currentComputation.firstRun) { // We naturally start disabled.
            disable();
        }
    }
});


function enable() {
    // Run every time the fragment identifier changes.
    window.addEventListener("hashchange", onHashChange);

    // Run directly if the DOM has already been loaded.
    if (['loaded', 'interactive', 'complete'].indexOf(document.readyState) > -1) {
        window.setTimeout(onHashChange, 0);
    }
    else {
        // Or run as soon as the DOM has loaded.
        window.addEventListener("load", onHashChange);
    }
}


function disable() {
    window.removeEventListener("hashchange", onHashChange);
    window.removeEventListener("load", onHashChange);

    // Clean up the current highlight, if any.
    if (cleanupHighlight !== null) {
        cleanupHighlight();
        cleanupHighlight = null;
    }
}


module.exports = {
    enabled: enabled,
};
