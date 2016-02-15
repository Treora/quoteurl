/* Implements a not (yet) standardised encoding of Open Annotation selectors in URL fragment identifiers.
 * Concretely, this enables making a URL point to a specified *piece* of a document, e.g. any textual quote.
 *
 * Currently, it only supports a text quote selector, encoded simply with double quotation marks: "ipsum"
 * Optionally a prefix and/or suffix can be added to disambiguate the quote: (Lorem )"ipsum"( dolor sit)
 * Resulting in a URL like this: http://example.com/page.html#(Lorem )"ipsum"( dolor sit)
 */

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


function fragmentIdentifierFromSelector(selector) {
    if (selector === null) {
        // No selector means empty fragment identifier.
        return '';
    }

    var type = selector.type;
    if (type == 'TextQuoteSelector') {
        var exact = selector.exact;
        /*
        // TODO Add prefix and suffix when the exact quote is ambiguous (e.g. appears twice)
        var maybePrefix = (selector.prefix !== undefined) ? '('+selector.prefix+')' : '';
        var maybeSuffix = (selector.suffix !== undefined) ? '('+selector.suffix+')' : '';
        var fragmentIdentifier = maybePrefix + '"'+exact+'"' + maybeSuffix;
        */
        var fragmentIdentifier = '"'+exact+'"';

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
