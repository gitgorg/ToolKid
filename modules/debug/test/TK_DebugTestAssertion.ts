//testing for conditions and throw errors if not met
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    assert(
        label: string,
        value: GenericFunction,
        shouldBe: typeof Error
    ): void,
    assert(
        label: string,
        value: any,
        shouldBe: any
    ): void,
    assert(inputs: {
        [label: string]: [value: any, shouldBe: any] | ({
            value: any,
            shouldBe: any,
        } & TK_AssertConfig),
    }): void,
    assert(inputs: {
        CONFIG?: TK_AssertConfig,
        [label: string]:
        [value: any, shouldBe: any] //short notation
        | ({  //regular notation
            value: any,
            shouldBe: any,
        } & TK_AssertConfig)
        | TK_AssertConfig //only allowed for CONFIG property,
        | undefined
    }): void,
    assertEquality(inputs: {
        [name: string]: {
            value: any,
            shouldBe: any,
        } & TK_AssertConfig
    }): void
}

type TK_AssertConfig = {
    allowAdditions?: true,
    catchFailure?: {
        (
            errorMessage: [description: string, ...details: any[]]
        ): void
    },
    toleranceDepth?: number,
    passOnDepthExceed?: true,
}



(function TK_DebugTestAssertion_init() {
    const defaultConfig = {};
    const publicExports = module.exports = <TK_DebugTest_file>{};

    publicExports.assert = function TK_DebugTestAssertion_assert(...inputs: any[]) {
        const errors = <(string | EqualityDifference)[]>[];
        if (inputs.length === 3) {
            assertEqualityPerName(errors, [inputs[0], { value: inputs[1], shouldBe: inputs[2] }]);
            if (errors.length !== 0) {
                throw errors;
            }
            return;
        }

        if (inputs.length !== 1) {
            throw ["TK_DebugTestAssertion_assert - takes 3 arguments (label, value, expectedValue) or one config object, not:", inputs.length, "inputs:", inputs];
        }

        Object.entries(inputs[0]).forEach(assertComplex.bind(null,
            errors, inputs[0].CONFIG || defaultConfig
        ));
        if (errors.length !== 0) {
            throw errors;
        }
    };

    const assertComplex = function TK_DebugTestAssertion_assertComplex(
        errors: (string | EqualityDifference)[],
        baseConfig: TK_AssertConfig,
        nameAndConfig: [string, Dictionary],
    ) {
        const [, config] = nameAndConfig;
        if (isShortConfig(config)) {
            assertEqualityPerName(errors, [
                nameAndConfig[0], {
                    ...baseConfig,
                    value: config[0],
                    shouldBe: config[1]
                }
            ]);
        } else {
            assertEqualityPerName(errors, [
                nameAndConfig[0], {
                    ...baseConfig,
                    ...nameAndConfig[1]
                }
            ]);
        }
    };

    publicExports.assertEquality = function TK_Debug_assertEquality(inputs) {
        const errors = <(string | EqualityDifference)[]>[];
        Object.entries(inputs).forEach(assertEqualityPerName.bind(null, errors));
        if (errors.length !== 0) {
            throw errors;
        }
    };

    const assertEqualityPerName = function TK_Debug_assertEqualityPerName(
        errors: (string | EqualityDifference)[],
        nameAndConfig: [testName: string, config: any]
    ) {
        const config = nameAndConfig[1];
        if (config.shouldBe === Error) {
            let returned;
            try {
                returned = config.value();
            } catch (error) {
                return;
            }
            errors.push(...["~ " + nameAndConfig[0] + " ~ value did not fail - it returned:", returned]);
            return;
        }

        const returned = ToolKid.dataTypes.checks.areEqual(config);
        if (returned === true) {
            return;
        }


        let errorMessage: any[];
        if (config.passOnDepthExceed !== true) {
            errorMessage = ["~ " + nameAndConfig[0] + " ~ value did not meet expectations:", ...returned];
        } else {
            const cleaned = returned.filter(isNotTooDeep);
            if (cleaned.length === 0) {
                return;
            }

            errorMessage = ["~ " + nameAndConfig[0] + " ~ value did not meet expectations:", ...cleaned];
        }
        if (typeof config.catchFailure === "function") {
            config.catchFailure(errorMessage);
        } else {
            errors.push(...errorMessage);
        }
    };

    const isNotTooDeep = function TK_DebugTestAssertion_isNotToDeep(
        difference: EqualityDifference
    ) {
        return difference.type !== "tooDeep";
    };

    const isShortConfig = (typeof Array.isArray === "function")
        ? function TK_DebugTestAssertion_isShortConfig(value: any) {
            return Array.isArray(value) && value.length === 2;
        } : function TK_DebugTestAssertion_isShortConfigLegacy(value: any) {
            return value instanceof Array && value.length === 2;
        };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "test", entries: publicExports });
    }
})();