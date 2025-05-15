//supporting functions for custom Library building
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
        log(111111, pattern)
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
        log(2222222, pattern)
        if (inputs.isFromStartToEnd === true) {
            pattern = "^" + pattern + "$";
        }
        let flags = "vs";
        if (inputs.isRepeatable === true) {
            flags += "g";
        }
        return new RegExp(pattern, flags);
    };

    publicExports.createTextReplacer = function LibraryParsing_createTextReplacer(...patterns) {
        let matchers = <string[]>[];
        let generators = <TextGenerator[]>[];
        patterns.forEach(function (pattern) {
            let generator = pattern[1];
            if (typeof generator !== "function") {
                generator = returnText.bind(null, generator);
            }

            matchers.push(getRegExSource(pattern[0]));
            generators.push(generator);
        });
        const generator = (generators.length === 1)
            ? generators[0]
            : useGeneratorChoice.bind(null, generators);
        const pattern = (generators.length === 1)
            ? new RegExp(matchers[0], "g")
            : new RegExp("(" + matchers.join(")|(") + ")", "g");
        return textReplacer.bind(null, pattern, generator);
    };

    const textReplacer = function LibraryParsing_textReplacer(
        pattern: RegExp,
        generator: GenericFunction,
        text: string,
    ) {
        // log(text, pattern, generator)
        const parts = <string[]>[];
        let position = 0;
        let found = pattern.exec(text);
        while (found !== null) {
            if (position !== found.index) {
                parts.push(text.slice(position, found.index));
            }
            parts.push(generator(found));
            position = found.index + found[0].length;
            found = pattern.exec(text);
        }
        if (position !== text.length) {
            parts.push(text.slice(position))
        }
        return parts.join("");
    };

    const useGeneratorChoice = function LibraryParsing_useGeneratorChoice(
        generators: TextGeneratorFunction[], found: RegExpExecArray
    ) {
        const patternID = found.slice(1).findIndex(isDefined);
        return generators[patternID](found);
    };

    const returnText = function (value: string) {
        return value;
    };

    const getRegExSource = function (value: string | RegExp) {
        if (value instanceof RegExp) {
            return value.source;
        } else if (typeof value !== "string") {
            return value;
        }

        return escapeRegExp(value);
    };

    const escapeRegExp = textReplacer.bind(null,
        /\./g,
        function (found: RegExpExecArray) {
            return "\\.";
        }
    );

    const isDefined = function LibraryParsing_isDefined(value: any) {
        return value !== undefined
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



    Object.freeze(publicExports);
})();