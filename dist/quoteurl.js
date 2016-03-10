(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _domAnchorTextPosition = require('dom-anchor-text-position');

var _domAnchorTextPosition2 = _interopRequireDefault(_domAnchorTextPosition);

var CONTEXT_LENGTH = 32;

var TextQuoteAnchor = (function () {
  function TextQuoteAnchor(root, exact) {
    var context = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    _classCallCheck(this, TextQuoteAnchor);

    if (root === undefined) {
      throw new Error('missing required parameter "root"');
    }
    if (exact === undefined) {
      throw new Error('missing required parameter "exact"');
    }
    this.root = root;
    this.exact = exact;
    this.prefix = context.prefix;
    this.suffix = context.suffix;
  }

  // Convert a quote to a regular expression to find the quoted text.

  _createClass(TextQuoteAnchor, [{
    key: 'toRange',
    value: function toRange(options) {
      return this.toPositionAnchor(options).toRange();
    }
  }, {
    key: 'toSelector',
    value: function toSelector() {
      var selector = {
        type: 'TextQuoteSelector',
        exact: this.exact
      };
      if (this.prefix !== undefined) selector.prefix = this.prefix;
      if (this.suffix !== undefined) selector.suffix = this.suffix;
      return selector;
    }
  }, {
    key: 'toPositionAnchor',
    value: function toPositionAnchor() {
      var root = this.root;
      var text = root.textContent;

      var pattern = quoteToRegExp(this.exact);

      // Search for the pattern.
      var start = text.search(pattern);
      if (start === -1) {
        throw new Error('no match found');
      }
      var end = start + text.match(pattern)[0].length;

      return new _domAnchorTextPosition2['default'](root, start, end);
    }
  }], [{
    key: 'fromRange',
    value: function fromRange(root, range) {
      if (range === undefined) {
        throw new Error('missing required parameter "range"');
      }

      var position = _domAnchorTextPosition2['default'].fromRange(root, range);
      return this.fromPositionAnchor(position);
    }
  }, {
    key: 'fromSelector',
    value: function fromSelector(root) {
      var selector = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return new TextQuoteAnchor(root, selector.exact, selector);
    }
  }, {
    key: 'fromPositionAnchor',
    value: function fromPositionAnchor(anchor) {
      var root = anchor.root;

      var start = anchor.start;
      var end = anchor.end;

      var exact = root.textContent.substr(start, end - start);

      var prefixStart = Math.max(0, start - CONTEXT_LENGTH);
      var prefix = root.textContent.substr(prefixStart, start - prefixStart);

      var suffixEnd = Math.min(root.textContent.length, end + CONTEXT_LENGTH);
      var suffix = root.textContent.substr(end, suffixEnd - end);

      return new TextQuoteAnchor(root, exact, { prefix: prefix, suffix: suffix });
    }
  }]);

  return TextQuoteAnchor;
})();

exports['default'] = TextQuoteAnchor;
function quoteToRegExp(string) {
  function regexEscape(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
  var escapedString = regexEscape(string);

  // Whitespace is whitespace, do not fuss about types and amounts of it.
  var regex = escapedString.replace(/\s+/g, '\\s+');

  // Let ellipsis match any text.
  var ellipsis = '...';
  // Escape twice: we want to find the escaped sequence '\.\.\.' in the regex.
  var escapedEllipsis = regexEscape(regexEscape(ellipsis));
  regex = regex.replace(new RegExp(escapedEllipsis, 'g'), '(?:.|[\\r\\n])+');

  return new RegExp(regex, 'g');
}
module.exports = exports['default'];

},{"dom-anchor-text-position":4}],2:[function(require,module,exports){
var highlightRange = (function () {
// Wrap each text node in a given DOM Range with a <span class=[highLightClass]>.
// Breaks start and/or end node if needed.
// Returns a function that cleans up the created highlight (not a perfect undo: split text nodes are not merged again).
//
// Parameters:
// - rangeObject: a Range whose start and end containers are text nodes.
// - highlightClass: the CSS class the text pieces in the range should get, defaults to 'highlighted-range'.
function highlightRange(rangeObject, highlightClass) {
    // Ignore range if empty.
    if (rangeObject.collapsed) {
        return;
    }

    if (typeof highlightClass == 'undefined') {
        highlightClass = 'highlighted-range';
    }

    // First put all nodes in an array (splits start and end nodes)
    var nodes = textNodesInRange(rangeObject);

    // Remember range details to restore it later.
    var startContainer = rangeObject.startContainer;
    var startOffset = rangeObject.startOffset;
    var endContainer = rangeObject.endContainer;
    var endOffset = rangeObject.endOffset;

    // Highlight each node
    var highlights = [];
    for (nodeIdx in nodes) {
        highlights.push(highlightNode(nodes[nodeIdx], highlightClass));
    }

    // The rangeObject gets messed up by our DOM changes. Be kind and restore.
    rangeObject.setStart(startContainer, startOffset);
    rangeObject.setEnd(endContainer, endOffset);

    // Return a function that cleans up the highlights.
    function cleanupHighlights() {
        // Remember range details to restore it later.
        var startContainer = rangeObject.startContainer;
        var startOffset = rangeObject.startOffset;
        var endContainer = rangeObject.endContainer;
        var endOffset = rangeObject.endOffset;

        // Remove each of the created highlights.
        for (var highlightIdx in highlights) {
            removeHighlight(highlights[highlightIdx]);
        }

        // Be kind and restore the rangeObject again.
        rangeObject.setStart(startContainer, startOffset);
        rangeObject.setEnd(endContainer, endOffset);
    }
    return cleanupHighlights;
}


// Return an array of the text nodes in the range. Split the start and end nodes if required.
function textNodesInRange(rangeObject) {
    // Modify Range to make sure that the start and end nodes are text nodes.
    setRangeToTextNodes(rangeObject);

    var nodes = [];

    // Ignore range if empty.
    if (rangeObject.collapsed) {
        return nodes;
    }

    // Include (part of) the start node if needed.
    if (rangeObject.startOffset != rangeObject.startContainer.length) {
        // If only part of the start node is in the range, split it.
        if (rangeObject.startOffset != 0) {
            // Split startContainer to turn the part after the startOffset into a new node.
            var createdNode = rangeObject.startContainer.splitText(rangeObject.startOffset);

            // If the end was in the same container, it will now be in the newly created node.
            if (rangeObject.endContainer === rangeObject.startContainer) {
                rangeObject.setEnd(createdNode, rangeObject.endOffset - rangeObject.startOffset);
            }

            // Update the start node, which no longer has an offset.
            rangeObject.setStart(createdNode, 0);
        }
    }

    // Create an iterator to iterate through the nodes.
    var root = (typeof rangeObject.commonAncestorContainer != 'undefined')
               ? rangeObject.commonAncestorContainer
               : document.body; // fall back to whole document for browser compatibility
    var iter = document.createNodeIterator(root, NodeFilter.SHOW_TEXT);

    // Find the start node (could we somehow skip this seemingly needless search?)
    while (iter.referenceNode !== rangeObject.startContainer && iter.referenceNode !== null) {
        iter.nextNode();
    }

    // Add each node up to (but excluding) the end node.
    while (iter.referenceNode !== rangeObject.endContainer && iter.referenceNode !== null) {
        nodes.push(iter.referenceNode);
        iter.nextNode();
    }

    // Include (part of) the end node if needed.
    if (rangeObject.endOffset != 0) {

        // If it is only partly included, we need to split it up.
        if (rangeObject.endOffset != rangeObject.endContainer.length) {
            // Split the node, breaking off the part outside the range.
            rangeObject.endContainer.splitText(rangeObject.endOffset);
            // Note that the range object need not be updated.

            //assert(rangeObject.endOffset == rangeObject.endContainer.length);
        }

        // Add the end node.
        nodes.push(rangeObject.endContainer);
    }

    return nodes;
}


// Normalise the range to start and end in a text node.
// Copyright (c) 2015 Randall Leeds
function setRangeToTextNodes(rangeObject) {
    function getFirstTextNode(node) {
        if (node.nodeType === Node.TEXT_NODE) return node;
        var document = node.ownerDocument;
        var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
        return walker.firstChild();
    }

    var startNode = rangeObject.startContainer;
    var startOffset = rangeObject.startOffset;

    // Drill down to a text node if the range starts at the container boundary.
    if (startNode.nodeType !== Node.TEXT_NODE) {
        if (startOffset === startNode.childNodes.length) {
            startNode = startNode.childNodes[startOffset - 1];
            startNode = getFirstTextNode(startNode);
            startOffset = startNode.textContent.length;
        } else {
            startNode = startNode.childNodes[startOffset];
            startNode = getFirstTextNode(startNode);
            startOffset = 0;
        }
        rangeObject.setStart(startNode, startOffset);
    }

    var endNode = rangeObject.endContainer;
    var endOffset = rangeObject.endOffset;

    // Drill down to a text node if the range ends at the container boundary.
    if (endNode.nodeType !== Node.TEXT_NODE) {
        if (endOffset === endNode.childNodes.length) {
            endNode = endNode.childNodes[endOffset - 1];
            endNode = getFirstTextNode(endNode);
            endOffset = endNode.textContent.length;
        } else {
            endNode = endNode.childNodes[endOffset];
            endNode = getFirstTextNode(endNode);
            endOffset = 0;
        }
        rangeObject.setEnd(endNode, endOffset);
    }
}


// Replace [node] with <span class=[highlightClass]>[node]</span>
function highlightNode(node, highlightClass) {
    // Create a highlight
    var highlight = document.createElement('span');
    highlight.classList.add(highlightClass);

    // Wrap it around the text node
    node.parentNode.replaceChild(highlight, node);
    highlight.appendChild(node);

    return highlight;
}


// Remove a highlight <span> created with highlightNode.
function removeHighlight(highlight) {
    // Move its children (normally just one text node) into its parent.
    while (highlight.firstChild) {
        highlight.parentNode.insertBefore(highlight.firstChild, highlight);
    }
    // Remove the now empty node
    highlight.remove();
}

return highlightRange;
})();

if (typeof module !== 'undefined') {
    module.exports = highlightRange;
}

},{}],3:[function(require,module,exports){
// Highlight the quote when one is found in the URL's fragment identifier.

var Tracker = require('trackr');
var ReactiveVar = require('trackr-reactive-var');
var TextQuoteAnchor = require('dom-anchor-text-quote');
var highlightRange = require('dom-highlight-range');
var scrollIntoView = require('scroll-into-view');

var selectorInUrl = require('./oa-selector-in-url');

// Whether module is enabled.
var enabled = new ReactiveVar(false);

// Remembers how to remove the previously set highlight.
var cleanupHighlight = null;


function onHashChange(event) {
    if (enabled.get()) {
        var fragmentIdentifier = getFragmentIdentifier();
        processFragmentIdentifier(fragmentIdentifier, {scroll: true});
    }
}


function getFragmentIdentifier() {
        // Read the #hash part from the URL
        var hash = window.location.hash;

        // Ditch the '#', decode URI-escaped characters
        var fragmentIdentifier = window.decodeURIComponent(hash.substring(1, hash.length));

        return fragmentIdentifier;
}


function processFragmentIdentifier(fragmentIdentifier, options) {
    if (options === undefined)  options = {};
    var scroll = options.scroll;

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

        // Scroll to the start of the range if desired.
        if (scroll) {
            var element = range.startContainer.parentElement;
            scrollIntoView(element, {time: 200});
        }
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


function runOnce(options) {
    if (options === undefined)  options = {};

    var run = function () {
        var fragmentIdentifier = getFragmentIdentifier();
        processFragmentIdentifier(fragmentIdentifier, options);
    };

    // Run directly or as soon as possible.
    if (['loaded', 'interactive', 'complete'].indexOf(document.readyState) > -1) {
        run();
    }
    else {
        // Run as soon as the DOM has loaded.
        window.addEventListener("load", run);
    }
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
    runOnce: runOnce,
};

},{"./oa-selector-in-url":15,"dom-anchor-text-quote":1,"dom-highlight-range":2,"scroll-into-view":9,"trackr":14,"trackr-reactive-var":11}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _nodeIteratorShim = require('node-iterator-shim');

var _nodeIteratorShim2 = _interopRequireDefault(_nodeIteratorShim);

var _domSeek = require('dom-seek');

var _domSeek2 = _interopRequireDefault(_domSeek);

var SHOW_TEXT = NodeFilter.SHOW_TEXT;

function getFirstTextNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return node;
  var document = node.ownerDocument;
  var walker = document.createTreeWalker(node, SHOW_TEXT, null, false);
  return walker.firstChild();
}

var TextPositionAnchor = (function () {
  function TextPositionAnchor(root, start, end) {
    _classCallCheck(this, TextPositionAnchor);

    if (root === undefined) {
      throw new Error('missing required parameter "root"');
    }
    if (start === undefined) {
      throw new Error('missing required parameter "start"');
    }
    if (end === undefined) {
      throw new Error('missing required parameter "end"');
    }
    this.root = root;
    this.start = start;
    this.end = end;
  }

  _createClass(TextPositionAnchor, [{
    key: 'toRange',
    value: function toRange() {
      var root = this.root;
      var document = root.ownerDocument;
      var range = document.createRange();
      var iter = (0, _nodeIteratorShim2['default'])(root, SHOW_TEXT);

      var start = this.start;
      var end = this.end;

      var count = (0, _domSeek2['default'])(iter, start);
      var remainder = start - count;

      if (iter.pointerBeforeReferenceNode) {
        range.setStart(iter.referenceNode, remainder);
      } else {
        // If the iterator advanced it will be left with its pointer after the
        // reference node. The next node that is needed to create the range.
        range.setStart(iter.nextNode(), remainder);
        iter.previousNode(); // Rewind so as not to change the next result.
      }

      var length = end - start + remainder;
      count = (0, _domSeek2['default'])(iter, length);
      remainder = length - count;

      if (iter.pointerBeforeReferenceNode) {
        range.setEnd(iter.referenceNode, remainder);
      } else {
        // Same as above, but no need to rewind.
        range.setEnd(iter.nextNode(), remainder);
      }

      return range;
    }
  }, {
    key: 'toSelector',
    value: function toSelector() {
      return {
        type: 'TextPositionSelector',
        start: this.start,
        end: this.end
      };
    }
  }], [{
    key: 'fromRange',
    value: function fromRange(root, range) {
      if (root === undefined) {
        throw new Error('missing required parameter "root"');
      }
      if (range === undefined) {
        throw new Error('missing required parameter "range"');
      }

      var startNode = range.startContainer;
      var startOffset = range.startOffset;

      // Drill down to a text node if the range starts at the container boundary.
      if (startNode.nodeType !== Node.TEXT_NODE) {
        if (startOffset === startNode.childNodes.length) {
          startNode = startNode.childNodes[startOffset - 1];
          startNode = getFirstTextNode(startNode);
          startOffset = startNode.textContent.length;
        } else {
          startNode = startNode.childNodes[startOffset];
          startNode = getFirstTextNode(startNode);
          startOffset = 0;
        }
      }

      var endNode = range.endContainer;
      var endOffset = range.endOffset;

      // Drill down to a text node if the range ends at the container boundary.
      if (endNode.nodeType !== Node.TEXT_NODE) {
        if (endOffset === endNode.childNodes.length) {
          endNode = endNode.childNodes[endOffset - 1];
          endNode = getFirstTextNode(endNode);
          endOffset = endNode.textContent.length;
        } else {
          endNode = endNode.childNodes[endOffset];
          endNode = getFirstTextNode(endNode);
          endOffset = 0;
        }
      }

      var iter = (0, _nodeIteratorShim2['default'])(root, SHOW_TEXT);
      var start = (0, _domSeek2['default'])(iter, startNode);
      var end = start + (0, _domSeek2['default'])(iter, endNode);

      return new TextPositionAnchor(root, start + startOffset, end + endOffset);
    }
  }, {
    key: 'fromSelector',
    value: function fromSelector(root) {
      var selector = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return new TextPositionAnchor(root, selector.start, selector.end);
    }
  }]);

  return TextPositionAnchor;
})();

exports['default'] = TextPositionAnchor;
module.exports = exports['default'];

},{"dom-seek":5,"node-iterator-shim":6}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = seek;
var E_SHOW = 'Argument 1 of seek must use filter NodeFilter.SHOW_TEXT.';
var E_WHERE = 'Argument 2 of seek must be a number or a Text Node.';

function seek(iter, where) {
  if (iter.whatToShow !== NodeFilter.SHOW_TEXT) {
    throw new Error(E_SHOW);
  }

  var count = 0;
  var node = iter.referenceNode;
  var predicates = null;

  if (isNumber(where)) {
    predicates = {
      forward: function forward() {
        return count < where;
      },
      backward: function backward() {
        return count > where;
      }
    };
  } else if (isText(where)) {
    predicates = {
      forward: function forward() {
        return before(node, where);
      },
      backward: function backward() {
        return !iter.pointerBeforeReferenceNode || after(node, where);
      }
    };
  } else {
    throw new Error(E_WHERE);
  }

  while (predicates.forward() && (node = iter.nextNode()) !== null) {
    count += node.textContent.length;
  }

  while (predicates.backward() && (node = iter.previousNode()) !== null) {
    count -= node.textContent.length;
  }

  return count;
}

function isNumber(n) {
  return !isNaN(parseInt(n)) && isFinite(n);
}

function isText(node) {
  return node.nodeType === Node.TEXT_NODE;
}

function before(ref, node) {
  return node.compareDocumentPosition(ref) & Node.DOCUMENT_POSITION_PRECEDING;
}

function after(ref, node) {
  return node.compareDocumentPosition(ref) & Node.DOCUMENT_POSITION_FOLLOWING;
}
module.exports = exports['default'];

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = createNodeIterator;

function createNodeIterator(root, whatToShow) {
  var filter = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  var document = root.ownerDocument;
  var iter = document.createNodeIterator(root, whatToShow, filter, false);
  return typeof iter.referenceNode === 'undefined' ? shim(iter, root) : iter;
}

function shim(iter, root) {
  var _referenceNode = root;
  var _pointerBeforeReferenceNode = true;

  return Object.create(NodeIterator.prototype, {
    root: {
      get: function get() {
        return iter.root;
      }
    },

    whatToShow: {
      get: function get() {
        return iter.whatToShow;
      }
    },

    filter: {
      get: function get() {
        return iter.filter;
      }
    },

    referenceNode: {
      get: function get() {
        return _referenceNode;
      }
    },

    pointerBeforeReferenceNode: {
      get: function get() {
        return _pointerBeforeReferenceNode;
      }
    },

    detach: {
      get: function get() {
        return iter.detach;
      }
    },

    nextNode: {
      value: function value() {
        var result = iter.nextNode();
        _pointerBeforeReferenceNode = false;
        if (result === null) {
          return null;
        } else {
          _referenceNode = result;
          return _referenceNode;
        }
      }
    },

    previousNode: {
      value: function value() {
        var result = iter.previousNode();
        _pointerBeforeReferenceNode = true;
        if (result === null) {
          return null;
        } else {
          _referenceNode = result;
          return _referenceNode;
        }
      }
    }
  });
}
module.exports = exports['default'];

},{}],7:[function(require,module,exports){
(function (global){
var now = require('performance-now')
  , root = typeof window === 'undefined' ? global : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = root['request' + suffix]
  , caf = root['cancel' + suffix] || root['cancelRequest' + suffix]

for(var i = 0; !raf && i < vendors.length; i++) {
  raf = root[vendors[i] + 'Request' + suffix]
  caf = root[vendors[i] + 'Cancel' + suffix]
      || root[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  return raf.call(root, fn)
}
module.exports.cancel = function() {
  caf.apply(root, arguments)
}
module.exports.polyfill = function() {
  root.requestAnimationFrame = raf
  root.cancelAnimationFrame = caf
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"performance-now":8}],8:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.7.1
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

}).call(this,require('_process'))
},{"_process":18}],9:[function(require,module,exports){
var raf = require('raf'),
    COMPLETE = 'complete',
    CANCELED = 'canceled';

function setElementScroll(element, x, y){
    if(element === window){
        element.scrollTo(x, y);
    }else{
        element.scrollLeft = x;
        element.scrollTop = y;
    }
}

function getTargetScrollLocation(target, parent, align){
    var targetPosition = target.getBoundingClientRect(),
        parentPosition,
        x,
        y,
        differenceX,
        differenceY,
        leftAlign = align && align.left != null ? align.left : 0.5,
        topAlign = align && align.top != null ? align.top : 0.5,
        leftScalar = leftAlign,
        topScalar = topAlign;

    if(parent === window){
        x = targetPosition.left + window.scrollX - window.innerWidth * leftScalar + Math.min(targetPosition.width, window.innerWidth) * leftScalar;
        y = targetPosition.top + window.scrollY - window.innerHeight * topScalar + Math.min(targetPosition.height, window.innerHeight) * topScalar;
        x = Math.max(Math.min(x, document.body.scrollWidth - window.innerWidth * leftScalar), 0);
        y = Math.max(Math.min(y, document.body.scrollHeight- window.innerHeight * topScalar), 0);
        differenceX = x - window.scrollX;
        differenceY = y - window.scrollY;
    }else{
        parentPosition = parent.getBoundingClientRect();
        var offsetTop = targetPosition.top - (parentPosition.top - parent.scrollTop);
        var offsetLeft = targetPosition.left - (parentPosition.left - parent.scrollLeft);
        x = offsetLeft + (targetPosition.width * leftScalar) - parent.clientWidth * leftScalar;
        y = offsetTop + (targetPosition.height * topScalar) - parent.clientHeight * topScalar;
        x = Math.max(Math.min(x, parent.scrollWidth - parent.clientWidth), 0);
        y = Math.max(Math.min(y, parent.scrollHeight - parent.clientHeight), 0);
        differenceX = x - parent.scrollLeft;
        differenceY = y - parent.scrollTop;
    }

    return {
        x: x,
        y: y,
        differenceX: differenceX,
        differenceY: differenceY
    };
}

function animate(parent){
    raf(function(){
        var scrollSettings = parent._scrollSettings;
        if(!scrollSettings){
            return;
        }

        var location = getTargetScrollLocation(scrollSettings.target, parent, scrollSettings.align),
            time = Date.now() - scrollSettings.startTime,
            timeValue = Math.min(1 / scrollSettings.time * time, 1);

        if(
            time > scrollSettings.time + 20 ||
            (Math.abs(location.differenceY) <= 1 && Math.abs(location.differenceX) <= 1)
        ){
            setElementScroll(parent, location.x, location.y);
            parent._scrollSettings = null;
            return scrollSettings.end(COMPLETE);
        }

        var valueX = timeValue,
            valueY = timeValue;

        setElementScroll(parent,
            location.x - location.differenceX * Math.pow(1 - valueX, valueX / 2),
            location.y - location.differenceY * Math.pow(1 - valueY, valueY / 2)
        );

        animate(parent);
    });
}

function transitionScrollTo(target, parent, settings, callback){
    var idle = !parent._scrollSettings;

    if(parent._scrollSettings){
        parent._scrollSettings.end(CANCELED);
    }

    function end(endType){
        parent._scrollSettings = null;
        callback(endType);
        parent.removeEventListener('touchstart', end);
    }

    parent._scrollSettings = {
        startTime: Date.now(),
        target: target,
        time: settings.time,
        ease: settings.ease,
        align: settings.align,
        end: end
    };
    parent.addEventListener('touchstart', end.bind(null, CANCELED));

    if(idle){
        animate(parent);
    }
}

module.exports = function(target, settings, callback){
    if(!target){
        return;
    }

    if(typeof settings === 'function'){
        callback = settings;
        settings = null;
    }

    if(!settings){
        settings = {};
    }

    settings.time = settings.time || 1000;
    settings.ease = settings.ease || function(v){return v;};

    var parent = target.parentElement,
        parents = 0;

    function done(endType){
        parents--;
        if(!parents){
            callback && callback(endType);
        }
    }

    while(parent){
        if(
            settings.validTarget ? settings.validTarget(parent, parents) : true &&
            parent === window ||
            (
                parent.scrollHeight !== parent.clientHeight ||
                parent.scrollWidth !== parent.clientWidth
            ) &&
            getComputedStyle(parent).overflow !== 'hidden'
        ){
            parents++;
            transitionScrollTo(target, parent, settings, done);
        }

        parent = parent.parentElement;

        if(!parent){
            return;
        }

        if(parent.tagName === 'BODY'){
            parent = window;
        }
    }
};
},{"raf":7}],10:[function(require,module,exports){
// github.com/2is10/selectionchange-polyfill

var selectionchange = (function (undefined) {

  var MAC = /^Mac/.test(navigator.platform);
  var MAC_MOVE_KEYS = [65, 66, 69, 70, 78, 80]; // A, B, E, F, P, N from support.apple.com/en-ie/HT201236
  var SELECT_ALL_MODIFIER = MAC ? 'metaKey' : 'ctrlKey';
  var RANGE_PROPS = ['startContainer', 'startOffset', 'endContainer', 'endOffset'];
  var HAS_OWN_SELECTION = {INPUT: 1, TEXTAREA: 1};

  var ranges;

  return {
    start: function (doc) {
      var d = doc || document;
      if (ranges || !hasNativeSupport(d) && (ranges = newWeakMap())) {
        if (!ranges.has(d)) {
          ranges.set(d, getSelectionRange(d));
          on(d, 'input', onInput);
          on(d, 'keydown', onKeyDown);
          on(d, 'mousedown', onMouseDown);
          on(d, 'mousemove', onMouseMove);
          on(d, 'mouseup', onMouseUp);
          on(d.defaultView, 'focus', onFocus);
        }
      }
    },
    stop: function (doc) {
      var d = doc || document;
      if (ranges && ranges.has(d)) {
        ranges['delete'](d);
        off(d, 'input', onInput);
        off(d, 'keydown', onKeyDown);
        off(d, 'mousedown', onMouseDown);
        off(d, 'mousemove', onMouseMove);
        off(d, 'mouseup', onMouseUp);
        off(d.defaultView, 'focus', onFocus);
      }
    }
  };

  function hasNativeSupport(doc) {
    var osc = doc.onselectionchange;
    if (osc !== undefined) {
      try {
        doc.onselectionchange = 0;
        return doc.onselectionchange === null;
      } catch (e) {
      } finally {
        doc.onselectionchange = osc;
      }
    }
    return false;
  }

  function newWeakMap() {
    if (typeof WeakMap !== 'undefined') {
      return new WeakMap();
    } else {
      console.error('selectionchange: WeakMap not supported');
      return null;
    }
  }

  function getSelectionRange(doc) {
    var s = doc.getSelection();
    return s.rangeCount ? s.getRangeAt(0) : null;
  }

  function on(el, eventType, handler) {
    el.addEventListener(eventType, handler, true);
  }

  function off(el, eventType, handler) {
    el.removeEventListener(eventType, handler, true);
  }

  function onInput(e) {
    if (!HAS_OWN_SELECTION[e.target.tagName]) {
      dispatchIfChanged(this, true);
    }
  }

  function onKeyDown(e) {
    var code = e.keyCode;
    if (code === 65 && e[SELECT_ALL_MODIFIER] && !e.shiftKey && !e.altKey || // Ctrl-A or Cmd-A
        code >= 35 && code <= 40 || // home, end and arrow key
        e.ctrlKey && MAC && MAC_MOVE_KEYS.indexOf(code) >= 0) {
      if (!HAS_OWN_SELECTION[e.target.tagName]) {
        setTimeout(dispatchIfChanged.bind(null, this), 0);
      }
    }
  }

  function onMouseDown(e) {
    if (e.button === 0) {
      on(this, 'mousemove', onMouseMove);
      setTimeout(dispatchIfChanged.bind(null, this), 0);
    }
  }

  function onMouseMove(e) {  // only needed while primary button is down
    if (e.buttons & 1) {
      dispatchIfChanged(this);
    } else {
      off(this, 'mousemove', onMouseMove);
    }
  }

  function onMouseUp(e) {
    if (e.button === 0) {
      setTimeout(dispatchIfChanged.bind(null, this), 0);
    } else {
      off(this, 'mousemove', onMouseMove);
    }
  }

  function onFocus() {
    setTimeout(dispatchIfChanged.bind(null, this.document), 0);
  }

  function dispatchIfChanged(doc, force) {
    var r = getSelectionRange(doc);
    if (force || !sameRange(r, ranges.get(doc))) {
      ranges.set(doc, r);
      setTimeout(doc.dispatchEvent.bind(doc, new Event('selectionchange')), 0);
    }
  }

  function sameRange(r1, r2) {
    return r1 === r2 || r1 && r2 && RANGE_PROPS.every(function (prop) {
      return r1[prop] === r2[prop];
    });
  }
})();

if (typeof module !== 'undefined') {
    // CommonJS/Node compatibility.
    module.exports = selectionchange;
}

},{}],11:[function(require,module,exports){
var Tracker = require('trackr');

var ReactiveVar;
/*
 * ## [new] ReactiveVar(initialValue, [equalsFunc])
 *
 * A ReactiveVar holds a single value that can be get and set,
 * such that calling `set` will invalidate any Computations that
 * called `get`, according to the usual contract for reactive
 * data sources.
 *
 * A ReactiveVar is much like a Session variable -- compare `foo.get()`
 * to `Session.get("foo")` -- but it doesn't have a global name and isn't
 * automatically migrated across hot code pushes.  Also, while Session
 * variables can only hold JSON or EJSON, ReactiveVars can hold any value.
 *
 * An important property of ReactiveVars, which is sometimes the reason
 * to use one, is that setting the value to the same value as before has
 * no effect, meaning ReactiveVars can be used to absorb extra
 * invalidations that wouldn't serve a purpose.  However, by default,
 * ReactiveVars are extremely conservative about what changes they
 * absorb.  Calling `set` with an object argument will *always* trigger
 * invalidations, because even if the new value is `===` the old value,
 * the object may have been mutated.  You can change the default behavior
 * by passing a function of two arguments, `oldValue` and `newValue`,
 * to the constructor as `equalsFunc`.
 *
 * This class is extremely basic right now, but the idea is to evolve
 * it into the ReactiveVar of Geoff's Lickable Forms proposal.
 */

/**
 * @class 
 * @instanceName reactiveVar
 * @summary Constructor for a ReactiveVar, which represents a single reactive variable.
 * @locus Client
 * @param {Any} initialValue The initial value to set.  `equalsFunc` is ignored when setting the initial value.
 * @param {Function} [equalsFunc] Optional.  A function of two arguments, called on the old value and the new value whenever the ReactiveVar is set.  If it returns true, no set is performed.  If omitted, the default `equalsFunc` returns true if its arguments are `===` and are of type number, boolean, string, undefined, or null.
 */
ReactiveVar = function (initialValue, equalsFunc) {
  if (! (this instanceof ReactiveVar))
    // called without `new`
    return new ReactiveVar(initialValue, equalsFunc);

  this.curValue = initialValue;
  this.equalsFunc = equalsFunc;
  this.dep = new Tracker.Dependency;
};

ReactiveVar._isEqual = function (oldValue, newValue) {
  var a = oldValue, b = newValue;
  // Two values are "equal" here if they are `===` and are
  // number, boolean, string, undefined, or null.
  if (a !== b)
    return false;
  else
    return ((!a) || (typeof a === 'number') || (typeof a === 'boolean') ||
            (typeof a === 'string'));
};

/**
 * @summary Returns the current value of the ReactiveVar, establishing a reactive dependency.
 * @locus Client
 */
ReactiveVar.prototype.get = function () {
  if (Tracker.active)
    this.dep.depend();

  return this.curValue;
};

/**
 * @summary Sets the current value of the ReactiveVar, invalidating the Computations that called `get` if `newValue` is different from the old value.
 * @locus Client
 * @param {Any} newValue
 */
ReactiveVar.prototype.set = function (newValue) {
  var oldValue = this.curValue;

  if ((this.equalsFunc || ReactiveVar._isEqual)(oldValue, newValue))
    // value is same as last time
    return;

  this.curValue = newValue;
  this.dep.changed();
};

ReactiveVar.prototype.toString = function () {
  return 'ReactiveVar{' + this.get() + '}';
};

ReactiveVar.prototype._numListeners = function() {
  // Tests want to know.
  // Accesses a private field of Tracker.Dependency.
  var count = 0;
  for (var id in this.dep._dependentsById)
    count++;
  return count;
};

module.exports = ReactiveVar;

},{"trackr":14}],12:[function(require,module,exports){
var now = require('performance-now')
  , global = typeof window === 'undefined' ? {} : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = global['request' + suffix]
  , caf = global['cancel' + suffix] || global['cancelRequest' + suffix]

for(var i = 0; i < vendors.length && !raf; i++) {
  raf = global[vendors[i] + 'Request' + suffix]
  caf = global[vendors[i] + 'Cancel' + suffix]
      || global[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  return raf.call(global, fn)
}
module.exports.cancel = function() {
  caf.apply(global, arguments)
}

},{"performance-now":13}],13:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"_process":18,"dup":8}],14:[function(require,module,exports){
(function (global){
/////////////////////////////////////////////////////
// Package docs at http://docs.meteor.com/#tracker //
// Last merge: https://github.com/meteor/meteor/blob/696876b1848e4d6a920143422c2c50c4501c85a3/packages/tracker/tracker.js //
/////////////////////////////////////////////////////

//
module.exports = (function() {

// check for global and use that one instead of loading a new one
if (typeof global.Trackr !== "undefined") {
	return global.Trackr;
}

/**
 * @namespace Trackr
 * @summary The namespace for Trackr-related methods.
 */
var Trackr = global.Trackr = {};

// http://docs.meteor.com/#tracker_active

/**
 * @summary True if there is a current computation, meaning that dependencies on reactive data sources will be tracked and potentially cause the current computation to be rerun.
 * @locus Client
 * @type {Boolean}
 */
Trackr.active = false;

// http://docs.meteor.com/#tracker_currentcomputation

/**
 * @summary The current computation, or `null` if there isn't one.	The current computation is the [`Trackr.Computation`](#tracker_computation) object created by the innermost active call to `Trackr.autorun`, and it's the computation that gains dependencies when reactive data sources are accessed.
 * @locus Client
 * @type {Trackr.Computation}
 */
Trackr.currentComputation = null;

// References to all computations created within the Trackr by id.
// Keeping these references on an underscore property gives more control to
// tooling and packages extending Trackr without increasing the API surface.
// These can used to monkey-patch computations, their functions, use
// computation ids for tracking, etc.
Trackr._computations = {};

var setCurrentComputation = function (c) {
	Trackr.currentComputation = c;
	Trackr.active = !! c;
};

var _debugFunc = function () {
	return (typeof console !== "undefined") && console.error ?
			 function () { console.error.apply(console, arguments); } :
			 function () {};
};

var _throwOrLog = function (from, e) {
	if (throwFirstError) {
		throw e;
	} else {
		var printArgs = ["Exception from Trackr " + from + " function:"];
		if (e.stack && e.message && e.name) {
			var idx = e.stack.indexOf(e.message);
			if (idx < 0 || idx > e.name.length + 2) { // check for "Error: "
				// message is not part of the stack
				var message = e.name + ": " + e.message;
				printArgs.push(message);
			}
		}
		printArgs.push(e.stack);

		for (var i = 0; i < printArgs.length; i++) {
			_debugFunc()(printArgs[i]);
		}
	}
};

// Takes a function `f`, and wraps it in a `Meteor._noYieldsAllowed`
// block if we are running on the server. On the client, returns the
// original function (since `Meteor._noYieldsAllowed` is a
// no-op). This has the benefit of not adding an unnecessary stack
// frame on the client.
var withNoYieldsAllowed = function (f) {
	return f;
};

var nextId = 1;
// computations whose callbacks we should call at flush time
var pendingComputations = [];
// `true` if a Trackr.flush is scheduled, or if we are in Trackr.flush now
var willFlush = false;
// `true` if we are in Trackr.flush now
var inFlush = false;
// `true` if we are computing a computation now, either first time
// or recompute.	This matches Trackr.active unless we are inside
// Trackr.nonreactive, which nullfies currentComputation even though
// an enclosing computation may still be running.
var inCompute = false;
// `true` if the `_throwFirstError` option was passed in to the call
// to Trackr.flush that we are in. When set, throw rather than log the
// first error encountered while flushing. Before throwing the error,
// finish flushing (from a finally block), logging any subsequent
// errors.
var throwFirstError = false;

var afterFlushCallbacks = [];

var requestAnimationFrame = require("raf");

var requireFlush = function () {
	if (! willFlush) {
		requestAnimationFrame(Trackr._runFlush);
		willFlush = true;
	}
};

// Trackr.Computation constructor is visible but private
// (throws an error if you try to call it)
var constructingComputation = false;

//
// http://docs.meteor.com/#tracker_computation

/**
 * @summary A Computation object represents code that is repeatedly rerun
 * in response to
 * reactive data changes. Computations don't have return values; they just
 * perform actions, such as rerendering a template on the screen. Computations
 * are created using Trackr.autorun. Use stop to prevent further rerunning of a
 * computation.
 * @instancename computation
 */
Trackr.Computation = function (f, parent, options) {
	if (! constructingComputation)
		throw new Error(
			"Trackr.Computation constructor is private; use Trackr.autorun");
	constructingComputation = false;

	var self = this;
	options = options || {};

	// http://docs.meteor.com/#computation_stopped

	/**
	 * @summary True if this computation has been stopped.
	 * @locus Client
	 * @memberOf Trackr.Computation
	 * @instance
	 * @name	stopped
	 */
	self.stopped = false;

	// http://docs.meteor.com/#computation_invalidated

	/**
	 * @summary True if this computation has been invalidated (and not yet rerun), or if it has been stopped.
	 * @locus Client
	 * @memberOf Trackr.Computation
	 * @instance
	 * @name	invalidated
	 * @type {Boolean}
	 */
	self.invalidated = false;

	// http://docs.meteor.com/#computation_firstrun

	/**
	 * @summary True during the initial run of the computation at the time `Trackr.autorun` is called, and false on subsequent reruns and at other times.
	 * @locus Client
	 * @memberOf Trackr.Computation
	 * @instance
	 * @name	firstRun
	 * @type {Boolean}
	 */
	self.firstRun = true;

	self._id = nextId++;
	self._onInvalidateCallbacks = [];
	self._onStopCallbacks = [];
	// the plan is at some point to use the parent relation
	// to constrain the order that computations are processed
	self._parent = parent;
	self._func = f;
	self._onError = options.onError;
	self._recomputing = false;
	self._context = options.context || null;

	// Register the computation within the global Trackr.
	Trackr._computations[self._id] = self;

	var errored = true;
	try {
		self._compute();
		errored = false;
	} finally {
		self.firstRun = false;
		if (errored)
			self.stop();
	}
};

// http://docs.meteor.com/#computation_oninvalidate

/**
 * @summary Registers `callback` to run when this computation is next invalidated, or runs it immediately if the computation is already invalidated.	The callback is run exactly once and not upon future invalidations unless `onInvalidate` is called again after the computation becomes valid again.
 * @locus Client
 * @param {Function} callback Function to be called on invalidation. Receives one argument, the computation that was invalidated.
 */
Trackr.Computation.prototype.onInvalidate = function (f, ctx) {
	var self = this;

	if (typeof f !== 'function')
		throw new Error("onInvalidate requires a function");

	if (self.invalidated) {
		Trackr.nonreactive(function () {
			withNoYieldsAllowed(f).call(ctx || self._context, self);
		});
	} else {
		self._onInvalidateCallbacks.push({ fn: f, ctx: ctx });
	}
};

/**
 * @summary Registers `callback` to run when this computation is stopped, or runs it immediately if the computation is already stopped.	The callback is run after any `onInvalidate` callbacks.
 * @locus Client
 * @param {Function} callback Function to be called on stop. Receives one argument, the computation that was stopped.
 */
Trackr.Computation.prototype.onStop = function (f, ctx) {
	var self = this;

	if (typeof f !== 'function')
		throw new Error("onStop requires a function");

	if (self.stopped) {
		Trackr.nonreactive(function () {
			withNoYieldsAllowed(f).call(ctx || self._context, self);
		});
	} else {
		self._onStopCallbacks.push({ fn: f, ctx: ctx });
	}
};

// http://docs.meteor.com/#computation_invalidate

/**
 * @summary Invalidates this computation so that it will be rerun.
 * @locus Client
 */
Trackr.Computation.prototype.invalidate = function () {
	var self = this;
	if (! self.invalidated) {
		// if we're currently in _recompute(), don't enqueue
		// ourselves, since we'll rerun immediately anyway.
		if (! self._recomputing && ! self.stopped) {
			requireFlush();
			pendingComputations.push(this);
		}

		self.invalidated = true;

		// callbacks can't add callbacks, because
		// self.invalidated === true.
		for(var i = 0, f; f = self._onInvalidateCallbacks[i]; i++) {
			Trackr.nonreactive(function () {
				withNoYieldsAllowed(f.fn).call(f.ctx || self._context, self);
			});
		}
		self._onInvalidateCallbacks = [];
	}
};

// http://docs.meteor.com/#computation_stop

/**
 * @summary Prevents this computation from rerunning.
 * @locus Client
 */
Trackr.Computation.prototype.stop = function () {
	var self = this;

	if (! self.stopped) {
		self.stopped = true;
		self.invalidate();
		// Unregister from global Trackr.
		delete Trackr._computations[self._id];
		for(var i = 0, f; f = self._onStopCallbacks[i]; i++) {
			Trackr.nonreactive(function () {
				withNoYieldsAllowed(f.fn).call(f.ctx || self._context, self);
			});
		}
		self._onStopCallbacks = [];
	}
};

Trackr.Computation.prototype._compute = function () {
	var self = this;
	self.invalidated = false;

	var previous = Trackr.currentComputation;
	setCurrentComputation(self);
	var previousInCompute = inCompute;
	inCompute = true;
	try {
		withNoYieldsAllowed(self._func).call(self._context, self);
	} finally {
		setCurrentComputation(previous);
		inCompute = previousInCompute;
	}
};

Trackr.Computation.prototype._needsRecompute = function () {
	var self = this;
	return self.invalidated && ! self.stopped;
};

Trackr.Computation.prototype._recompute = function () {
	var self = this;

	self._recomputing = true;
	try {
		if (self._needsRecompute()) {
			try {
				self._compute();
			} catch (e) {
				if (self._onError) {
					self._onError(e);
				} else {
					_throwOrLog("recompute", e);
				}
			}
		}
	} finally {
		self._recomputing = false;
	}
};

//
// http://docs.meteor.com/#tracker_dependency

/**
 * @summary A Dependency represents an atomic unit of reactive data that a
 * computation might depend on. Reactive data sources such as Session or
 * Minimongo internally create different Dependency objects for different
 * pieces of data, each of which may be depended on by multiple computations.
 * When the data changes, the computations are invalidated.
 * @class
 * @instanceName dependency
 */
Trackr.Dependency = function () {
	this._dependentsById = {};
};

// http://docs.meteor.com/#dependency_depend
//
// Adds `computation` to this set if it is not already
// present.	Returns true if `computation` is a new member of the set.
// If no argument, defaults to currentComputation, or does nothing
// if there is no currentComputation.

/**
 * @summary Declares that the current computation (or `fromComputation` if given) depends on `dependency`.	The computation will be invalidated the next time `dependency` changes.

If there is no current computation and `depend()` is called with no arguments, it does nothing and returns false.

Returns true if the computation is a new dependent of `dependency` rather than an existing one.
 * @locus Client
 * @param {Trackr.Computation} [fromComputation] An optional computation declared to depend on `dependency` instead of the current computation.
 * @returns {Boolean}
 */
Trackr.Dependency.prototype.depend = function (computation) {
	if (! computation) {
		if (! Trackr.active)
			return false;

		computation = Trackr.currentComputation;
	}
	var self = this;
	var id = computation._id;
	if (! (id in self._dependentsById)) {
		self._dependentsById[id] = computation;
		computation.onInvalidate(function () {
			delete self._dependentsById[id];
		});
		return true;
	}
	return false;
};

// http://docs.meteor.com/#dependency_changed

/**
 * @summary Invalidate all dependent computations immediately and remove them as dependents.
 * @locus Client
 */
Trackr.Dependency.prototype.changed = function () {
	var self = this;
	for (var id in self._dependentsById)
		self._dependentsById[id].invalidate();
};

// http://docs.meteor.com/#dependency_hasdependents

/**
 * @summary True if this Dependency has one or more dependent Computations, which would be invalidated if this Dependency were to change.
 * @locus Client
 * @returns {Boolean}
 */
Trackr.Dependency.prototype.hasDependents = function () {
	var self = this;
	for(var id in self._dependentsById)
		return true;
	return false;
};

// http://docs.meteor.com/#tracker_flush

/**
 * @summary Process all reactive updates immediately and ensure that all invalidated computations are rerun.
 * @locus Client
 */
Trackr.flush = function (options) {
	Trackr._runFlush({ finishSynchronously: true,
											throwFirstError: options && options._throwFirstError });
};

// Run all pending computations and afterFlush callbacks.	If we were not called
// directly via Trackr.flush, this may return before they're all done to allow
// the event loop to run a little before continuing.
Trackr._runFlush = function (options) {
	// XXX What part of the comment below is still true? (We no longer
	// have Spark)
	//
	// Nested flush could plausibly happen if, say, a flush causes
	// DOM mutation, which causes a "blur" event, which runs an
	// app event handler that calls Trackr.flush.	At the moment
	// Spark blocks event handlers during DOM mutation anyway,
	// because the LiveRange tree isn't valid.	And we don't have
	// any useful notion of a nested flush.
	//
	// https://app.asana.com/0/159908330244/385138233856
	if (inFlush)
		throw new Error("Can't call Trackr.flush while flushing");

	if (inCompute)
		throw new Error("Can't flush inside Trackr.autorun");

	options = options || {};

	inFlush = true;
	willFlush = true;
	throwFirstError = !! options.throwFirstError;

	var recomputedCount = 0;
	var finishedTry = false;
	try {
		while (pendingComputations.length ||
					 afterFlushCallbacks.length) {

			// recompute all pending computations
			while (pendingComputations.length) {
				var comp = pendingComputations.shift();
				comp._recompute();
				if (comp._needsRecompute()) {
					pendingComputations.unshift(comp);
				}

				if (! options.finishSynchronously && ++recomputedCount > 1000) {
					finishedTry = true;
					return;
				}
			}

			if (afterFlushCallbacks.length) {
				// call one afterFlush callback, which may
				// invalidate more computations
				var cb = afterFlushCallbacks.shift();
				try {
					cb.fn.call(cb.ctx);
				} catch (e) {
					_throwOrLog("afterFlush", e);
				}
			}
		}
		finishedTry = true;
	} finally {
		if (! finishedTry) {
			// we're erroring due to throwFirstError being true.
			inFlush = false; // needed before calling `Trackr.flush()` again
			// finish flushing
			Trackr._runFlush({
				finishSynchronously: options.finishSynchronously,
				throwFirstError: false
			});
		}
		willFlush = false;
		inFlush = false;
		if (pendingComputations.length || afterFlushCallbacks.length) {
			// We're yielding because we ran a bunch of computations and we aren't
			// required to finish synchronously, so we'd like to give the event loop a
			// chance. We should flush again soon.
			if (options.finishSynchronously) {
				throw new Error("still have more to do?");	// shouldn't happen
			}
			setTimeout(requireFlush, 10);
		}
	}
};

// http://docs.meteor.com/#tracker_autorun
//
// Run f(). Record its dependencies. Rerun it whenever the
// dependencies change.
//
// Returns a new Computation, which is also passed to f.
//
// Links the computation to the current computation
// so that it is stopped if the current computation is invalidated.

/**
 * @callback Trackr.ComputationFunction
 * @param {Trackr.Computation}
 */
/**
 * @summary Run a function now and rerun it later whenever its dependencies
 * change. Returns a Computation object that can be used to stop or observe the
 * rerunning.
 * @locus Client
 * @param {Trackr.ComputationFunction} runFunc The function to run. It receives
 * one argument: the Computation object that will be returned.
 * @param {Object} [options]
 * @param {Function} options.onError Optional. The function to run when an error
 * happens in the Computation. The only argument it recieves is the Error
 * thrown. Defaults to the error being logged to the console.
 * @returns {Trackr.Computation}
 */
Trackr.autorun = function (f, options, ctx) {
	if (typeof f !== 'function')
		throw new Error('Trackr.autorun requires a function argument');

	options = options || {};
	if (ctx) options.context = ctx;

	constructingComputation = true;
	var c = new Trackr.Computation(
		f, Trackr.currentComputation, options);

	if (Trackr.active)
		Trackr.onInvalidate(function () {
			c.stop();
		});

	return c;
};

// http://docs.meteor.com/#tracker_nonreactive
//
// Run `f` with no current computation, returning the return value
// of `f`.	Used to turn off reactivity for the duration of `f`,
// so that reactive data sources accessed by `f` will not result in any
// computations being invalidated.

/**
 * @summary Run a function without tracking dependencies.
 * @locus Client
 * @param {Function} func A function to call immediately.
 */
Trackr.nonReactive =
Trackr.nonreactive = function (f, ctx) {
	var previous = Trackr.currentComputation;
	setCurrentComputation(null);
	try {
		return f.call(ctx);
	} finally {
		setCurrentComputation(previous);
	}
};

// like nonreactive but makes a function instead
Trackr.nonReactable =
Trackr.nonreactable = function (f, ctx) {
	return function() {
		var args = arguments;
		var self = this;
		return Trackr.nonreactive(function() {
			return f.apply(ctx || self, args);
		});
	};
};

// http://docs.meteor.com/#tracker_oninvalidate

/**
 * @summary Registers a new [`onInvalidate`](#computation_oninvalidate) callback on the current computation (which must exist), to be called immediately when the current computation is invalidated or stopped.
 * @locus Client
 * @param {Function} callback A callback function that will be invoked as `func(c)`, where `c` is the computation on which the callback is registered.
 */
Trackr.onInvalidate = function (f, ctx) {
	if (! Trackr.active)
		throw new Error("Trackr.onInvalidate requires a currentComputation");

	Trackr.currentComputation.onInvalidate(f, ctx);
};

// http://docs.meteor.com/#tracker_afterflush

/**
 * @summary Schedules a function to be called during the next flush, or later in the current flush if one is in progress, after all invalidated computations have been rerun.	The function will be run once and not on subsequent flushes unless `afterFlush` is called again.
 * @locus Client
 * @param {Function} callback A function to call at flush time.
 */
Trackr.afterFlush = function (f, ctx) {
	afterFlushCallbacks.push({ fn: f, ctx: ctx });
	requireFlush();
};

// export it
return Trackr;

})();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"raf":12}],15:[function(require,module,exports){
/* Implements a not (yet) standardised encoding of Open Annotation selectors in URL fragment identifiers.
 * Concretely, this enables making a URL point to a specified *piece* of a document, e.g. any textual quote.
 *
 * Currently, it only supports a text quote selector, encoded simply with double quotation marks: "ipsum"
 * Optionally a prefix and/or suffix can be added to disambiguate the quote: (Lorem )"ipsum"( dolor sit)
 * Resulting in a URL like this: http://example.com/page.html#(Lorem )"ipsum"( dolor sit)
 */

// An arbitrary length, quotes beyond which will be shortened.
var MAX_QUOTE_LENGTH = 61;

function selectorFromFragmentIdentifier(fragmentIdentifier) {
    const pattern = /(?:\((.+)\))?"(.+)"(?:\((.+)\))?/;
    var match = fragmentIdentifier.match(pattern);
    if (match) {
        var prefix = match[1];
        var exact = match[2];
        var suffix = match[3];
        var selector = {
            type: 'TextQuoteSelector',
            exact: exact,
        };
        if (prefix !== undefined) selector.prefix = prefix;
        if (suffix !== undefined) selector.suffix = suffix;

        return selector;
    }
    return null;
}


function simplifyWhitespace(string) {
    // Turn any whitespace into a single space, and trim whitespace at the start or end.
    return string.replace(/\s+/g, ' ').replace(/^ | $/,'');
}

// Shorten too long quotes by replacing middle part with dots '...'.
function shortenQuote(quote, maxLength) {
    var length = quote.length;
    if (length <= maxLength) {
        // Text to quote is short enough. Quote in full.
        return quote;
    }
    else {
        // Text to quote is too long. Shorten it.
        var ellipsis = '...';
        // Quote the first and last pieces of the text.
        var pieceMaxLength = Math.floor((maxLength - ellipsis.length)/2);

        // First, try to nicely break the quote at whitespace.
        {
            // Do not allow the pieces to be too short either. Half the maximum seems reasonable.
            var pieceMinLength = Math.ceil(pieceMaxLength/2);
            // Get the start and end pieces
            var startAndEndRegExp = '^(.{' + (pieceMinLength-1) + ',' + (pieceMaxLength-1) + '}\\s)' // Starting piece (ends with space)
                                  + '.*?' // Anything in between, non-greedy
                                  + '(\\s.{' + (pieceMinLength-1) + ',' + (pieceMaxLength-1) + '})$'; // Ending piece (starts with space)
            var startAndEnd = quote.match(new RegExp(startAndEndRegExp));
        }
        var start, end;
        if (startAndEnd !== null) {
            // We found nice whitespace points at which to break the quote.
            start = startAndEnd[1];
            end = startAndEnd[2];
        }
        else {
            // No nice place to break it; just break it.
            start = quote.substring(0, pieceMaxLength);
            end = quote.substring(length-pieceMaxLength, length);
        }
        return start + ellipsis + end;
    }
}


function fragmentIdentifierFromSelector(selector) {
    if (selector === null) {
        // No selector means empty fragment identifier.
        return '';
    }

    var type = selector.type;
    if (type == 'TextQuoteSelector') {
        var quote = selector.exact;
        /*
        // TODO Add prefix and suffix when the exact quote is ambiguous (e.g. appears twice)
        var maybePrefix = (selector.prefix !== undefined) ? '('+selector.prefix+')' : '';
        var maybeSuffix = (selector.suffix !== undefined) ? '('+selector.suffix+')' : '';
        var fragmentIdentifier = maybePrefix + '"'+exact+'"' + maybeSuffix;
        */
        var quote = simplifyWhitespace(quote);
        quote = shortenQuote(quote, MAX_QUOTE_LENGTH);
        var fragmentIdentifier = '"' + quote + '"';

        return fragmentIdentifier;
    }
    else {
        throw new Error("Unsupported selector type: '"+type+"'.");
    }
}


module.exports = {
    selectorFromFragmentIdentifier: selectorFromFragmentIdentifier,
    fragmentIdentifierFromSelector: fragmentIdentifierFromSelector,
};

},{}],16:[function(require,module,exports){
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

},{"./dereferencing":3,"./referencing":17,"trackr":14}],17:[function(require,module,exports){
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
        // Signal our activity (intended to disable dereferencing).
        active.set(true);
        Tracker.flush(); // Force update now to prevent race condition with hashchange event.

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

},{"./oa-selector-in-url":15,"dom-anchor-text-quote":1,"selectionchange-polyfill":10,"trackr":14,"trackr-reactive-var":11}],18:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[16]);
