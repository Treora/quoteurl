# quoteurl
## Overview
The purpose is to allow URLs to point to any text piece in a document:

![Sketch of the idea](https://rawgit.com/Treora/quoteurl/master/idea.svg)

To both interpret and create the URLs, the module works bidirectionally:

![Overview of the functionality](https://rawgit.com/Treora/quoteurl/master/overview.svg)

## Example
To see things in action, check out this [quote in the example document](https://rawgit.com/Treora/quoteurl/master/example.html#"libero egestas"); then try select some other words to get a new URL.
(it seems that Firefox/Gecko has some issues still, Chromium/Webkit may work better)

## Usage
To make a page support quote-URLs, simply include `dist/quoteurl.js` (or `dist/quoteurl.min.js`) in that page: `<script src="dist/quoteurl.js"></script>`.

When using tools like [Browserify](http://browserify.org), `require('quoteurl');` should work. You can get the module from NPM's repository: `npm install quoteurl`.

Although currently very little extension or customisation is possible, the appearance of the highlighted text can be customised by styling the CSS class `highlighted-by-url` (use `!important` to override the property `background-color`).

## Notes
This implementation is a **proof of concept**, and is not reliable for production use. Some browsers do not always locate the quote correctly, and it usually messes up when the quoted text appears multiple times.

Moreover, a simple syntax of fragment identifiers has been chosen tentatively. This encoding may change in future versions, which would thus break with URLs created with this version; which leads us to the next point.

## Future standardisation?
This script only enables creating links to quotes within the page that incorporates the script. Ideally, this functionality would of course be available for *any* page.

A great step forward would be the standardisation of fragment identifiers that point to arbitrary pieces of an HTML document. Currently, fragment identifiers are only used to point to places in the document that have been given an identifier *by the document's publisher* (e.g. `<a name="section4" />`). We lack the ability to analyse a document and refer to any piece of it. Other hypertext systems (e.g [Ted Nelson's proposals][xanalogical-links]) included such functionality, and currently the work on [Open Annotation Selectors][oaselectors] attempts to standardise ways to refer to pieces of content, using JSON objects. A sensible way to build on top of this effort is to specify an encoding of OA Selectors in fragment identifiers (see [`oa-selector-in-url.js`](oa-selector-in-url.js)).

Standardisation would be a step towards browser integration, so that referring to quotes will work on any document. An implementation like this `quoteurl` could then be regarded merely as a shim to provide the functionality in backward browsers.

[oaselectors]: http://www.openannotation.org/spec/core/specific.html#Selectors
[xanalogical-links]: http://www.xanadu.com.au/ted/XUsurvey/xuDation.html#%22Xanalogical%20links%20are%20effectively%20overlays%20superimposed%20on%20contents%22
