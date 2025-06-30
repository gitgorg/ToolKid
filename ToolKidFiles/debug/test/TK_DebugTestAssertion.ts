//testing for conditions and throw errors if not met
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    assert(
        label: string, value: any, shouldBe: any
    ): void,
    assert(inputs: {
        [label: string]: [value: any, shouldBe: any] | {
            value: any,
            shouldBe: any,

            allowAdditions?: true,
            catchFailure?: {
                (
                    errorMessage: [description: string, ...details: any[]]
                ): void
            },
            logValue?: true,
            toleranceDepth?: number,
        }
    }): void,
    assertEquality(inputs: {
        [name: string]: {
            value: any,
            shouldBe: any,

            allowAdditions?: true,
            catchFailure?: {
                (
                    errorMessage: [description: string, ...details: any[]]
                ): void
            },
            toleranceDepth?: number,
        }
    }): void
}



(function TK_DebugTestAssertion_init() {
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

        Object.entries(inputs[0]).forEach(assertComplex.bind(null, errors));
        if (errors.length !== 0) {
            throw errors;
        }
    };

    const assertComplex = function TK_DebugTestAssertion_assertComplex(
        errors: (string | EqualityDifference)[],
        nameAndConfig: [string, Dictionary]
    ) {
        const [, config] = nameAndConfig;
        if (isShortConfig(config)) {
            assertEqualityPerName(errors, [
                nameAndConfig[0], { value: config[0], shouldBe: config[1] }
            ]);
        } else {
            assertEqualityPerName(errors, [
                nameAndConfig[0], nameAndConfig[1]
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
        errors: (string | EqualityDifference)[], nameAndConfig: [testName: string, config: any]
    ) {
        const [, config] = nameAndConfig;
        if (config.logValue === true) {
            console.log("~ " + nameAndConfig[0] + " ~ value is:", config.value);
        }
        const returned = ToolKid.dataTypes.checks.areEqual(config);
        if (returned === true) {
            return;
        }

        const errorMessage = ["~ " + nameAndConfig[0] + " ~ value did not meet expectations:", ...returned];
        if (typeof config.catchFailure === "function") {
            config.catchFailure(errorMessage);
        } else {
            errors.push(...errorMessage);
        }
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