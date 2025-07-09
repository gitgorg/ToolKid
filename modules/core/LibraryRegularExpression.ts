interface LibraryCore_file {
    getCoreModule(name: "regularExpression"): LibraryRegularExpression_file
}

type LibraryRegularExpression_file = {
    createSimpleRX(
        pattern: string
    ): RegExp,
    createSimpleRX(inputs: {
        pattern: string,
        isRepeatable: true,
    }): RegExp,
    createSimpleRX(inputs: {
        pattern: string,
        isFromStartToEnd: true,
    }): RegExp,

    createStringChecker(inputs: {
        includes?: RegExp[],
        excludes?: RegExp[]
    }): { (value: string): boolean },
}



(function LibraryRegularExpression_init() {
    const publicExports = module.exports = <LibraryRegularExpression_file>{};

    const checkString = function LibraryRegularExpression_checkString(
        value: string, expression: RegExp
    ) {
        return expression.test(value);
    };

    const checkStringConditions = function LibraryRegularExpression_checkStringConditions(
        conditions: {
            includes: RegExp[], excludes: RegExp[]
        },
        value: string
    ) {
        const test = checkString.bind(null, value);
        return conditions.includes.find(test) !== undefined
            && conditions.excludes.find(test) === undefined;
    };

    const checkStringExclusion = function checkStringExclusion(
        exclude: RegExp[], value: string
    ) {
        const test = checkString.bind(null, value);
        return exclude.find(test) === undefined;
    };

    const checkStringInclusion = function checkStringInclusion(
        include: RegExp[], value: string
    ) {
        const test = checkString.bind(null, value);
        return include.find(test) !== undefined;
    };

    const escapeSimpleRX = new RegExp("(\\*\\*)|(\\*)|\\" + [
        ".", "+", "?", "{", "}", "[", "]", "\\"
    ].join("|\\"), "g");
    publicExports.createSimpleRX = function LibraryRegularExpression_createSimpleRX(inputs: any) {
        if (typeof inputs === "string") {
            inputs = { pattern: inputs };
        }
        let pattern = <string>inputs.pattern;
        pattern = pattern.replace(escapeSimpleRX, function LibraryRegularExpression_createSimpleRXEscape(
            match, doubleStar, star
        ) {
            if (doubleStar !== undefined) {
                return ".*";
            } else if (star !== undefined) {
                return ".*?";
            }
            return "\\" + match;
        });
        if (inputs.isFromStartToEnd === true) {
            pattern = "^" + pattern + "$";
        }

        // regExp flags explained on top /\
        let flags = "s";
        if (inputs.isRepeatable === true) {
            flags += "g";
        }
        return new RegExp(pattern, flags);
    };

    // TODO: replacements more structured, maybe backwards compatible
    // const replacements = {
    //     "\\": "\\\\",
    //     ".": "\\.",
    //     "\*": ".+"
    // };

    publicExports.createStringChecker = function LibraryRegularExpression_createStringChecker(inputs): any {
        const hasIncludes = isArray(inputs.includes);
        const hasExcludes = isArray(inputs.excludes);
        if (hasIncludes && hasExcludes) {
            return checkStringConditions.bind(null, inputs);
        } else if (hasIncludes) {
            return checkStringInclusion.bind(null, inputs.includes);
        } else if (hasExcludes) {
            return checkStringExclusion.bind(null, inputs.excludes);
        } else {
            return function LibraryRegularExpression_checkNothing() { return true };
        }
    };

    const isArray = function LibraryRegularExpression_isArray(value: any) {
        return value instanceof Array && value.length !== 0;
    };



    Object.freeze(publicExports);
})();