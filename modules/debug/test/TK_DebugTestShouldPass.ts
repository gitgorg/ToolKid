//testing for conditions and throw errors if not met
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    shouldBeCloseTo(
        tollerance: number,
        wanted: number,
    ): ValueAsserter,
    shouldPass(
        check: { (value: any): boolean } | keyof TK_DataTypesChecks_file,
        ...additionalChecks: ({ (value: any): boolean } | keyof TK_DataTypesChecks_file)[]
    ): ValueAsserter,
    shouldPassAny(
        check1: shouldPassAnyInput,
        check2: shouldPassAnyInput,
        ...additionalChecks: shouldPassAnyInput[]
    ): ValueAsserter
}

type shouldPassAnyInput = ValueAsserter | number | string | Dictionary | any[] | undefined | boolean | null

type ValueAsserter = {
    (value: any): boolean,
    valueChecks: any[],
    wants: "any" | "none",
    to: "pass" | "fail"
}



(function TK_DebugTestShouldPass_init() {
    const publicExports = module.exports = <TK_DebugTest_file>{};



    const createValueChecker = function TD_DebugTestShouldPass_createValueChecker(
        mode: "pass" | "fail",
        value: any
    ) {
        return (mode === "fail")
            ? testFailure.bind(null, value)
            : testSuccess.bind(null, value);
    };

    publicExports.shouldBeCloseTo = function TK_DebugTestShouldPass_shouldBeCloseTo(
        tolerance, wanted,
    ) {
        return ValueAsserter({
            checks: [shouldBeCloseToCheck.bind(null, wanted, tolerance)],
            want: "none",
            to: "fail"
        });
    };
    const shouldBeCloseToCheck = function TK_DebugTestShouldBeCloseToCheck(
        wanted: any, tolerance: number, value: any
    ) {
        return typeof value === "number" && value >= wanted - tolerance && value <= wanted + tolerance;
    }

    publicExports.shouldPass = function TK_DebugTestShouldPass_shouldPass(...checks) {
        const { length } = checks;
        if (length === 0) {
            throw ["TK_DebugTestShouldPass_shouldPass - needs at least one check function"];
        }

        let entry = checks[0];
        for (let i = 0; i < length; i += 1) {
            entry = checks[i];
            if (typeof entry === "string") {
                checks[i] = <any>ToolKid.dataTypes.checks[entry];
            } else if (typeof entry !== "function") {
                throw ["TK_DebugTestShouldPass_shouldPass - invalid check found - needs function or known key:", {
                    invalidCheck: entry,
                    knownKeys: Object.keys(ToolKid.dataTypes.checks),
                    checks,
                }];
            }
        }

        return ValueAsserter({
            checks,
            want: "none",
            to: "fail"
        });
    };

    publicExports.shouldPassAny = function TK_DebugTestShouldPass_shouldPassAny(...checks) {
        if (checks.length < 2) {
            throw ["TK_DebugTestShouldPass_shouldPassAny - needs at least two check functions"];
        }

        return ValueAsserter({
            checks,
            want: "any",
            to: "pass"
        });
    };

    const testFailure = function TD_DebugTestShouldPass_testFailure(
        value: any,
        check: (value: any) => boolean
    ) {
        return check(value) !== true;
    };

    const testSuccess = function TD_DebugTestShouldPass_testSuccess(
        value: any,
        check: (value: any) => boolean
    ) {
        return check(value) === true;
    };

    const ValueAsserter = function TK_DebugTestShouldPass_ValueAsserter(inputs: {
        checks: any[],
        want: "none" | "any",
        to: "pass" | "fail"
    }) {
        const asserter = (inputs.want === "none")
            ? <ValueAsserter>wantsNone.bind(null, inputs)
            : <ValueAsserter>wantsAny.bind(null, inputs);

        asserter.valueChecks = inputs.checks;
        asserter.wants = inputs.want;
        asserter.to = inputs.to;
        return asserter;
    };

    const wantsAny = function TK_DebugTestShouldPass_wantsAny(bound: {
        checks: any, to: "pass" | "fail"
    }, value: any) {
        return bound.checks.findIndex(
            wantsAnySub.bind(
                null,
                createValueChecker(bound.to, value),
                value
            )
        ) !== -1;
    };

    const wantsAnySub = function TK_DebugTestShouldPass_wantsAnySub(
        checker: (shouldBe: any) => boolean,
        value: any,
        shouldBe: any
    ) {
        if (typeof shouldBe === "function") {
            return checker(shouldBe);
        } else {
            return shouldBe === value;
        }
    };

    const wantsNone = function TK_DebugTestShouldPass_wantsNone(bound: {
        checks: any, to: "pass" | "fail"
    }, value: any) {
        return bound.checks.findIndex(
            createValueChecker(bound.to, value)
        ) === -1;
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "test", entries: publicExports });
    }
})();