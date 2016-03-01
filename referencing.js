// Put any selected text into the URL's fragment identifier.

var Tracker = require('trackr');
var ReactiveVar = require('trackr-reactive-var');
var TextQuoteAnchor = require('dom-anchor-text-quote');
// Use polyfill for the 'selectionchange' event to support Firefox<45
require('selectionchange-polyfill').start();

var selectorInUrl = require('./oa-selector-in-url');

// Whether module is enabled.
var enabled = new ReactiveVar(false);

// Whether the URL is currently affected by a selection. Read-only.
var active = new ReactiveVar(false);


// Handler for window's selectionchanged event
function onSelectionChange(event) {
    // Check if we are still enabled (the event listener will be disabled only when Tracker flushes)
    if (enabled.get()) {
        var selection = document.getSelection();
        processSelection(selection);
    }
}


// Turn selection into fragment identifier, update window's URL.
function processSelection(selection) {
    if (selection!==null && !selection.isCollapsed) {
        // Transform selection -> range -> selector -> fragment identifier.
        var range = selection.getRangeAt(0);
        var selector = TextQuoteAnchor.fromRange(document.body, range).toSelector();
        var fragmentIdentifier = selectorInUrl.fragmentIdentifierFromSelector(selector);
        if (active.get()) {
            // If an existing selection is modified, prevent deluging browsing history.
            window.location.replace('#'+fragmentIdentifier);
        }
        else {
            window.location.assign('#'+fragmentIdentifier);
        }

        // Signal our activity (intended to disable dereferencing).
        active.set(true);
    }
    else { // Nothing is selected.
        // Clear fragment identifier
        //clearFragmentIdentifier();

        // Signal that selection is inactive (intended to reenable referencing)
        active.set(false);
    }
}


function clearFragmentIdentifier() {
    // Remove our influence from the URL (sets hash to empty string).
    window.location.assign('');
}


// Add and remove event listeners whenever we are switched on or off
Tracker.autorun(function () {
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
    // Run every time the selection changes.
    document.addEventListener("selectionchange", onSelectionChange);

    // Trigger once artificially if the user could already have been selecting things.
    if (['interactive', 'complete'].indexOf(document.readyState) > -1) {
        window.setTimeout(onSelectionChange, 0);
    }
}


function disable() {
    // Stop listening to events.
    window.removeEventListener("selectionchange", onSelectionChange);

    // Clean up the URL.
    clearFragmentIdentifier();

    // If active, deactivate.
    active.set(false);
}


module.exports = {
    enabled: enabled,
    active: active, // TODO turn into read-only version
};
