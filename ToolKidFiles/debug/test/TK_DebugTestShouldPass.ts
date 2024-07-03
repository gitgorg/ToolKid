//testing for conditions and throw errors if not met
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    shouldPass(
        check: (value: any) => boolean,
        ...additionalChecks: {
            (value: any): boolean
        }[]
    ): ValueAsserter,
    shouldPassAny(
        check1: (value: any) => boolean,
        check2: (value: any) => boolean,
        ...additionalChecks: {
            (value: any): boolean
        }[]
    ): ValueAsserter
}

type ValueAsserter = {
    (value: any): boolean,
    valueChecks: { (value: any): boolean }[],
    wants: "any" | "none",
    to: "pass" | "fail"
}



(function TK_DebugTestShouldPass_init() {
    const publicExports = module.exports = <TK_DebugTest_file>{};



    const createValueChecker = function TK_DebugTestAssertion_createValueChecker(
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

    const testFailure = function K_DebugTestAssertion_testFailure(
        value: any,
        check: (value: any) => boolean
    ) {
        return check(value) !== true;
    };

    const testSuccess = function K_DebugTestAssertion_testSuccess(
        value: any,
        check: (value: any) => boolean
    ) {
        return check(value) === true;
    };

    const ValueAsserter = function TK_DebugTestShouldPass_ValueAsserter(inputs: {
        checks: { (value: any): boolean }[],
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
            createValueChecker(bound.to, value)
        ) !== -1;
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
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();