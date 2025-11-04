(function TK_DebugTest_test() {
    /*test summary
        shouldPassSingle
        shouldPassMulti

        fail_shouldPassMulti
        fail_shouldPassWrongValue
        fail_shouldPassMissingValueChecker


        shouldPassAnyMatchFirst
        shouldPassAnyMatchSecond

        fail_shouldPassAnyUnwantedType
        fail_shouldPassAnyToFewChecks
    };*/



    const Debug = ToolKid.debug;
    const { assertFailure, assertEquality, shouldBeCloseTo, shouldPass, shouldPassAny, test } = Debug.test;

    const isNumber = function (value: any) { return typeof value === "number" && !Number.isNaN(value) };
    const isString = function (value: any) { return typeof value === "string" && value.length !== 0 };



    const closeTo10 = shouldBeCloseTo(2, 10);
    test({
        subject: shouldBeCloseTo,
        assert: {
            "exact fit tested": [10, shouldBeCloseTo(2, 10)],
            "exact fit": [closeTo10(10), true],
            "lower": [closeTo10(9), true],
            "lower limit": [closeTo10(8), true],
            "too low": [closeTo10(7), false],
            "higher": [closeTo10(11), true],
            "higher limit": [closeTo10(12), true],
            "too high": [closeTo10(13), false],
        }
    });

    const isBigger5 = function (value: any) {
        return value > 5
    };
    test({
        subject: shouldPass,
        execute: function shouldPassSingle() {
            assertEquality({
                "shouldPassSingle": {
                    value: {
                        boolean: false,
                        number: 0,
                        text: "another text"
                    },
                    shouldBe: {
                        boolean: false,
                        number: shouldPass(isNumber),
                        text: shouldPass(isString)
                    }
                }
            });
        }
    }, {
        subject: shouldPass,
        execute: function shouldPassMulti() {
            assertEquality({
                "shouldPassMulti": {
                    value: 10,
                    shouldBe: shouldPass(isNumber, isBigger5)
                }
            });
        }
    }, {
        subject: shouldPass,
        execute: function fail_shouldPassMulti() {
            assertFailure({
                name: "fail_shouldPassMulti",
                execute: assertEquality,
                withInputs: {
                    "fail_shouldPassMulti": {
                        value: 2,
                        shouldBe: shouldPass(isNumber, isBigger5)
                    }
                }
            });
        }
    }, {
        subject: shouldPass,
        execute: function fail_basic() {
            assertFailure({
                name: "fail_shouldPassWrongValue",
                execute: assertEquality,
                withInputs: {
                    "fail_shouldPassWrongValue": {
                        value: {
                            text: 10
                        },
                        shouldBe: {
                            text: shouldPass(isString)
                        }
                    },
                }
            }, {
                name: "fail_shouldPassMissingValueChecker",
                execute: assertEquality,
                withInputs: {
                    "fail_shouldPassMissingValueChecker": {
                        value: {
                            text: "text"
                        },
                        shouldBe: {
                            text: isString
                        }
                    },
                }
            });
        }
    });

    test({
        subject: shouldPassAny,
        execute: function shouldPassAnyBasic() {
            assertEquality({
                "shouldPassAnyMatchFirst": {
                    value: 19,
                    shouldBe: shouldPassAny(isNumber, isString)
                }, "shouldPassAnyMatchSecond": {
                    value: "text",
                    shouldBe: shouldPassAny(isNumber, isString)
                }, "shouldPassAnyStaticValue": {
                    value: 20,
                    shouldBe: shouldPassAny(10, 20, 30)
                }, "shouldPassAnyMixedStaticValue": {
                    value: shouldPassAny(0, isString)("0"),
                    shouldBe: true
                }
            });
        }
    }, {
        subject: shouldPassAny,
        execute: function fail_shouldPassAny() {
            assertEquality({
                "fail_shouldPassAnyUnwantedType": {
                    value: shouldPassAny(isNumber, isString)(true),
                    shouldBe: false
                }, "fail_shouldPassAnyWrongStaticValue": {
                    value: shouldPassAny(10, 20, 30)(0),
                    shouldBe: false
                }, "fail_shouldPassAnyMixedStaticValue": {
                    value: shouldPassAny(isString, undefined, NaN)(null),
                    shouldBe: false
                }
            });
            assertFailure({
                name: "fail_shouldPassAnyToFewChecks",
                execute: shouldPassAny,
                withInputs: isNumber
            });
        }
    });
})();