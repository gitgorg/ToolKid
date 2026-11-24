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
    const { assert, shouldBeCloseTo, shouldPass, shouldPassAny, test } = Debug.test;

    const isNumber = function (value: any) { return typeof value === "number" && !Number.isNaN(value) };
    const isString = function (value: any) { return typeof value === "string" && value.length !== 0 };



    const closeTo10 = shouldBeCloseTo(2, 10);
    test({
        subject: shouldBeCloseTo,
        assert: function () {
            return {
                "exact fit tested": [10, shouldBeCloseTo(2, 10)],
                "exact fit": [closeTo10(10), true],
                "lower": [closeTo10(9), true],
                "lower limit": [closeTo10(8), true],
                "too low": [closeTo10(7), false],
                "higher": [closeTo10(11), true],
                "higher limit": [closeTo10(12), true],
                "too high": [closeTo10(13), false],
            };
        }
    });

    const isBigger5 = function (value: any) {
        return value > 5
    };
    test({
        subject: shouldPass,
        assert: function shouldPassSingle() {
            return {
                "shouldPassSingle": [
                    {
                        boolean: false,
                        number: 0,
                        text: "another text"
                    },
                    {
                        boolean: false,
                        number: shouldPass(isNumber),
                        text: shouldPass(isString)
                    }
                ],
                "shouldPassMulti": [
                    10,
                    shouldPass(isNumber, isBigger5)
                ],
                "fail_shouldPassMulti": [
                    shouldPass(isNumber, isBigger5)(2),
                    false
                ],
                "fail_shouldPassWrongValue": [
                    shouldPass(isString)(10),
                    false,
                ],
                "fail_shouldPassAssertMulti": [
                    assert.bind(null, {
                        "fail_shouldPassAssertMulti": {
                            value: 2,
                            shouldBe: shouldPass(isNumber, isBigger5)
                        }
                    }),
                    Error
                ],
                "fail_shouldPassAssertMissingValueChecker": [
                    assert.bind(null, {
                        "fail_shouldPassAssertMissingValueChecker": {
                            value: {
                                text: "text"
                            },
                            shouldBe: {
                                text: isString
                            }
                        }
                    }), Error
                ],
            };
        }
    });

    test({
        subject: shouldPassAny,
        execute: function shouldPassAnyBasic() {
            assert({
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
        assert: function fail_shouldPassAny() {
            return ({
                "fail_shouldPassAnyUnwantedType": [
                    shouldPassAny(isNumber, isString)(true),
                    false
                ],
                "fail_shouldPassAnyWrongStaticValue": [
                    shouldPassAny(10, 20, 30)(0),
                    false
                ],
                "fail_shouldPassAnyMixedStaticValue": [
                    shouldPassAny(isString, undefined, NaN)(null),
                    false
                ],
                "fail_shouldPassAnyToFewChecks": [
                    shouldPassAny.bind(null, isNumber),
                    Error
                ]
            });
        }
    });
})();