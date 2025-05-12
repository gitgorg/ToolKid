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
    tokenize(inputs:{
        text: string,
        tokenSet: {
            [name:string]: {}
        },
        parser: {(): void}
    }): void,
}



(function LibraryParsing_init() {
    const publicExports = module.exports = <LibraryParsing_file>{};



    publicExports.createPatternMatcher = function LibraryParsing_createPatternMatcher(...patterns) {
        return matchPatternSimple.bind(null,
            new RegExp(patterns.map(getRexExpSource).join("|"))
        );
    };

    publicExports.createPatternMatcherComlex = function LibraryParsing_createPatternMatcherComplex(inputs) {
        if (inputs.indexPatterns === true) {
            return matchPatternIndexed.bind(null,
                new RegExp("(" + inputs.patterns.map(getRexExpSource).join(")|(") + ")")
            );
        } else {
            return publicExports.createPatternMatcher(...inputs.patterns);
        }
    };

    const getRexExpSource = function (value: string | RegExp) {
        return (value instanceof RegExp) ? value.source : value;
    };

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