//testing for conditions and throw errors if not met
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
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

    publicExports.assertEquality = function TK_Debug_assertEquality(...inputs) {
        const errors = <any[]>[];
        inputs.forEach(function TK_DebugTestAssertion_testForEquealityPerInput(inputs: Dictionary) {
            Object.entries(inputs).forEach(assertEqualityPerName.bind(null,errors));
        });
        if (errors.length !== 0) {
            throw errors;
        }
    };

    const assertEqualityPerName = function TK_Debug_assertEqualityPerName(
        errors:any[], nameAndValue: [testName: string, config: any]
    ) {
        const settings = Object.assign({}, nameAndValue[1]);
        if (typeof settings.toleranceDepth !== "number") {
            settings.toleranceDepth = 1;
        }
        const returned = ToolKid.dataTypes.checks.areEqual(settings);
        if (returned !== true) {
            const errorMessage = ["~ " + nameAndValue[0] + " ~ value did not meet expectations:", ...returned];
            if (typeof settings.catchFailure === "function") {
                settings.catchFailure(errorMessage);
            } else {
                errors.push(errorMessage);
            }
        }
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();