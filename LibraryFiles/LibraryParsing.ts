// regExp flags:
// g = to store .lastIndex inside the regExp
// s = to make . match really EVERY character...
// v = to support all the new unicode stuff

interface LibraryParsing_file {
    createPatternMatcher(
        ...patterns: (string | RegExp)[]
    ): {
        (text: string): [
            matchingPosition: number,
            matchingText: string | undefined,
        ]
    },
    createPatternMatcherComlex(iputs: {
        patterns: (string | RegExp)[],
        indexPatterns: true
    }): {
        (text: string): [
            matchingPosition: number,
            matchingText: string | undefined,
            matchigPatternIndex: number,
        ]
    },
    createRegExp(
        pattern: string
    ): RegExp,
    createRegExp(inputs: RegExpInputs & {
        isRepeatable?: true,
    }): RegExp,
    createRegExp(inputs: RegExpInputs & {
        isFromStartToEnd?: true,
    }): RegExp,
    createTextReplacer(
        firstPattern: [TextMatcher, TextGenerator], ...patterns: [TextMatcher, TextGenerator][]
    ): { (text: string): string },
}

type TextMatcher = string | RegExp
type TextGenerator = string | TextGeneratorFunction
type TextGeneratorFunction = { (expressionResult: RegExpExecArray): string | number }
type RegExpInputs = { pattern: string }



(function LibraryParsing_init() {
    const publicExports = module.exports = <LibraryParsing_file>{};

    publicExports.createPatternMatcher = function LibraryParsing_createPatternMatcher(...patterns) {
        return matchPatternSimple.bind(null,
            new RegExp(patterns.map(getRegExSource).join("|"))
        );
    };

    publicExports.createPatternMatcherComlex = function LibraryParsing_createPatternMatcherComplex(inputs) {
        if (inputs.indexPatterns === true) {
            return matchPatternIndexed.bind(null,
                new RegExp("(" + inputs.patterns.map(getRegExSource).join(")|(") + ")")
            );
        } else {
            return publicExports.createPatternMatcher(...inputs.patterns);
        }
    };

    const regExSimplify = /(\.|\?)|(\*\*)|(\*)/g;
    publicExports.createRegExp = function LibraryParsing_createRegEx(inputs: any) {
        if (typeof inputs === "string") {
            inputs = { pattern: inputs };
        }
        let pattern = <string>inputs.pattern;
        pattern = pattern.replaceAll(regExSimplify, function (
            match, control, doubleStar, star, index
        ) {
            if (control !== undefined) {
                return "\\" + match;
            } else if (doubleStar !== undefined) {
                return ".*";
            } else if (star !== undefined) {
                return ".*?";
            }
            return match;
        });
        if (inputs.isFromStartToEnd === true) {
            pattern = "^" + pattern + "$";
        }

        // regExp flags explained on top /\
        let flags = "sv";
        if (inputs.isRepeatable === true) {
            flags += "g";
        }
        return new RegExp(pattern, flags);
    };

    publicExports.createTextReplacer = function LibraryParsing_createTextReplacer(...patterns) {
        return replaceText.bind(null, ...setupPatternAndHandler(patterns));
    };

    const getRegExSource = function (value: string | RegExp) {
        if (value instanceof RegExp) {
            return value.source;
        } else if (typeof value === "string") {
            return escapeRegExp(value);
        } else {
            return value;
        }
    };

    const matchPatternIndexed = function LibraryParsing_matchPatternIndexed(
        regExp: RegExp, text: string
    ) {
        const found = text.match(regExp);
        return (found === null)
            ? [-1, undefined, -1]
            : [
                found.index,
                found[0],
                found.slice(1).findIndex(isDefined)
            ];
    };

    const matchPatternSimple = function LibraryParsing_matchPatternSimple(
        regExp: RegExp, text: string
    ) {
        const found = text.match(regExp);
        return (found === null)
            ? [-1, undefined]
            : [found.index, found[0]];
    };

    const replaceText = function LibraryParsing_replaceText(
        pattern: RegExp,
        handler: {(RXResult:RegExpExecArray): string},
        text: string,
    ) {
        const parts = <string[]>[];
        let position = 0;
        let RXResult = pattern.exec(text);
        while (RXResult !== null) {
            if (position !== RXResult.index) {
                parts.push(text.slice(position, RXResult.index));
            }
            parts.push(handler(RXResult));
            position = pattern.lastIndex;
            RXResult = pattern.exec(text);
        }
        if (position !== text.length) {
            parts.push(text.slice(position))
        }
        return parts.join("");
    };
    const escapeRegExp = replaceText.bind(null,
        /\./g,
        function (found: RegExpExecArray) {
            return "\\.";
        }
    );

    const returnText = function LibraryParsing_returnText(value: string) {
        return value;
    };

    const setupPatternAndHandler = function (
        patterns:[TextMatcher,TextGenerator][]
    ) {
        let matchers = <string[]>new Array(patterns.length);
        let handlers = <TextGenerator[]>new Array (patterns.length);
        patterns.forEach(function LibraryParsing_createTextReplacerGenerator(pattern, index) {
            matchers[index] = getRegExSource(pattern[0]);
            if (typeof pattern[1] === "function") {
                handlers[index] = pattern[1];
            } else {
                handlers[index] = returnText.bind(null, pattern[1]);
            }
        });
        // regExp flags explained on top /\
        return [
            (handlers.length === 1)
                ? new RegExp(matchers[0], "gsv")
                : new RegExp("(" + matchers.join(")|(") + ")", "gsv"),
            (patterns.length === 1)
                ? handlers[0]
                : useWantedHandler.bind(null, handlers)
        ];
    };

    const useWantedHandler = function LibraryParsing_useWantedHandler(
        handlers: { (expressionResult: RegExpExecArray): any }[],
        RXResult: RegExpExecArray
    ) {
        return handlers[
            RXResult.slice(1).findIndex(isDefined)
        ](RXResult);
    };

    const isDefined = function LibraryParsing_isDefined(value: any) {
        return value !== undefined
    };



    Object.freeze(publicExports);
})();