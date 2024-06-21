(function TK_DebugTest_test() {
    const Debug = ToolKid.debug;
    const { assertFailure, assertEquality, test } = Debug.test;



    test({
        subject: assertEquality,
        execute: function basicFailure() {
            try {
                assertEquality({
                    "basicFailure": {
                        value: true,
                        shouldBe: false
                    }
                });
            } catch (error) {
                return;
            }
            throw ["basicFailure din't throw"];
        }
    }, {
        subject: assertEquality,
        execute: function simpleEquality() {
            assertEquality({
                "number": {
                    value: 10,
                    shouldBe: 10
                },
                "boolean": {
                    value: true,
                    shouldBe: true
                },
                "text": {
                    value: "text",
                    shouldBe: "text"
                },
                "null": {
                    value: null,
                    shouldBe: null
                }
            });
        }
    }, {
        subject: assertEquality,
        execute: function trickyEquality() {
            assertEquality({
                "NaN": {
                    value: NaN,
                    shouldBe: NaN
                },
                "object": {
                    value: {},
                    shouldBe: {}
                },
                "array": {
                    value: [1],
                    shouldBe: [1]
                }
            });
        }
    }, {
        subject: assertEquality,
        execute: function strictIdentity() {
            const testObject = {}; const testArray = [1];
            assertEquality({
                "identical objects": {
                    value: testObject,
                    shouldBe: testObject,
                    toleranceDepth: 0
                },
                "identical arrays": {
                    value: testArray,
                    shouldBe: testArray,
                    toleranceDepth: 0
                }
            });
            assertFailure({
                name: "equal but not identical objects",
                execute: assertEquality,
                withInputs: {
                    "object": {
                        value: {},
                        shouldBe: testObject,
                        toleranceDepth: 0
                    }
                },
                shouldThrow: ["~ object ~ differences not tollerated between value:", {}, " and :", {}]
            }, {
                name: "equal but not identical arrays",
                execute: assertEquality,
                withInputs: {
                    "object": {
                        value: [1],
                        shouldBe: testArray,
                        toleranceDepth: 0
                    }
                },
                shouldThrow: ["~ object ~ differences not tollerated between value:", [1], " and :", [1]]
            });
        }
    }, {
        subject: assertEquality,
        execute: function shouldBeAtLeast() {
            const testObject = { text: "bla" };
            assertEquality({
                "identical object": {
                    value: testObject,
                    shouldBeAtLeast: testObject
                }, "equal object": {
                    value: { text: "bla" },
                    shouldBeAtLeast: testObject
                }, "extended object": {
                    value: { text: "bla", number: 100 },
                    shouldBeAtLeast: testObject
                }, "deeply extended": {
                    value: { number: 100, sub: { bonus: true, text: "bla" } },
                    shouldBeAtLeast: { sub: testObject },
                    toleranceDepth: 2
                }
            });
        }
    },{
        subject: assertEquality,
        execute: function fail_shouldBeAtLeast() {
            const testObject = { text: "bla" };
            assertFailure({
                name: "not extended",
                execute: assertEquality,
                withInputs: {
                    "fail1": {
                        value: { number: 100 },
                        shouldBeAtLeast: testObject
                    }
                },
                shouldThrow: ["~ fail1 ~ value.text is:",undefined,"but should be equal to:","bla"]
            }, {
                name: "not deeply extended",
                execute: assertEquality,
                withInputs: {
                    "fail2": {
                        value: { number: 100, sub: { bonus: true } },
                        shouldBeAtLeast: { sub: testObject }
                    }
                }
            }, {
                name: "equality not deep enough",
                execute: assertEquality,
                withInputs: {
                    "fail3": {
                        value: { number: 100, sub: { bonus: true, text: "bla" } },
                        shouldBeAtLeast: { sub: testObject },
                        toleranceDepth: 1
                    }
                }
            });
        }
    });
})();