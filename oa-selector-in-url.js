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
    const pattern = /(?:\((.+)\))?(?:"|%22)(.+)(?:"|%22)(?:\((.+)\))?/;
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
