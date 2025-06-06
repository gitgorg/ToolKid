//testing for conditions and throw errors if not met
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    shouldPass(
        check: { (value: any): boolean },
        ...additionalChecks: { (value: any): boolean }[]
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

    publicExports.shouldPass = function TK_DebugTestShouldPass_shouldPass(...checks) {
        if (checks.length === 0) {
            throw ["TK_DebugTestShouldPass_shouldPass - needs at least one check function"];
        }

        const fails = checks.filter(function (entry) { return typeof entry !== "function" });
        if (fails.length !== 0) {
            throw ["TK_DebugTestShouldPass_shouldPass - can only check with functions but got:", checks];
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
        const asserter: ValueAsserter = (inputs.want === "none")
            ? wantsNone.bind(null, inputs)
            : wantsAny.bind(null, inputs);

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
        ToolKid.registerFunctions({ section: "debug", subSection: "test", functions: publicExports });
    }
})();