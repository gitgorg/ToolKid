//supporting functions for custom Library building
interface LibraryTools_file {
    createStringCheck(inputs: {
        include?: RegExp[],
        exclude?: RegExp[]
    }): { (value: string): boolean },
    createSimpleRegxp(
        simpleExpression: string
    ): RegExp,
    partial<ReturnType>(
        baseFunction: { (...inputs: any[]): ReturnType },
        presetInput: any,
        ...additionalPresetInputs: any[]
    ): { (...inputs: any[]): ReturnType },
}



(function LibraryTools_init() {
    const publicExports = module.exports = <LibraryTools_file>{};

    publicExports.createStringCheck = function LibraryTools_createStringCheck(inputs): any {
        const hasIncludes = isArray(inputs.include);
        const hasExcludes = isArray(inputs.exclude);
        if (hasIncludes && hasExcludes) {
            return publicExports.partial(checkStringConditions, inputs);
        } else if (hasIncludes) {
            return publicExports.partial(checkStringInclusion, inputs.include);
        } else if (hasExcludes) {
            return publicExports.partial(checkStringExclusion, inputs.exclude);
        } else {
            return function LibraryTools_checkNothing() { return true };
        }
    };

    const checkString = function LibraryTools_checkString(
        value: string, expression: RegExp
    ) {
        return expression.test(value);
    };

    const checkStringConditions = function LibraryTools_checkStringConditions(
        conditions: {
            include: RegExp[], exclude: RegExp[]
        },
        value: string
    ) {
        const test = publicExports.partial(checkString, value);
        return conditions.include.find(test) !== undefined
            && conditions.exclude.find(test) === undefined;
    };

    const checkStringExclusion = function checkStringExclusion(
        exclude: RegExp[], value: string
    ) {
        const test = publicExports.partial(checkString, value);
        return exclude.find(test) === undefined;
    };

    const checkStringInclusion = function checkStringInclusion(
        include: RegExp[], value: string
    ) {
        const test = publicExports.partial(checkString, value);
        return include.find(test) !== undefined;
    };

    // TODO: replacements more structured, maybe backwards compatible
    // const replacements = {
    //     "\\": "\\\\",
    //     ".": "\\.",
    //     "\*": ".+"
    // };
    publicExports.createSimpleRegxp = function LibraryTools_createSimpleRegxp(
        expression
    ) {
        expression = expression.replaceAll("\\", "\\\\");
        expression = expression.replaceAll(".", "\\.");
        expression = expression.replaceAll("\*", ".+");
        //expression = expression.replace(replaceRegex, createSimpleRegxpReplacer);
        return new RegExp("^" + expression + "$");
    };

    const isArray = function LibraryTools_isArray(value:any) {
        return value instanceof Array && value.length !== 0;
    };

    publicExports.partial = function LibraryTools_partial(
        baseFunction: any, ...inputs
    ) {
        if (inputs.length === 0) {
            throw ["LibraryTools_partial - no inputs to preset for:", baseFunction];
        }

        const result = baseFunction.bind(null, ...inputs);
        if (baseFunction.presetInputs instanceof Array) {
            result.presetInputs = [...baseFunction.presetInputs, ...inputs];
        } else {
            result.presetInputs = inputs
        }
        return result;
    };



    Object.freeze(publicExports);
})();