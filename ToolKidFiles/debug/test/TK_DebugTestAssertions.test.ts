(function TK_DebugTest_test() {
    const Debug = ToolKid.debug;
    const { assertFailure, assertEquality, condition, test } = Debug.test;



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

    const referenceCondition = condition();
    test({
        subject: condition,
        execute: async function createAndResolve() {
            const promise = condition();
            assertEquality({
                "promise is instanceof Promise": {
                    value: promise instanceof Promise,
                    shouldBe: true
                },
                "promise.done": {
                    value: promise.done,
                    shouldBe: false
                },
                "typeof promise.resolve": {
                    value: typeof promise.succeed,
                    shouldBe: "function"
                },
                "typeof promise.reject": {
                    value: typeof promise.fail,
                    shouldBe: "function"
                }
            });
        }
    }, {
        subject: referenceCondition.succeed,
        execute: async function createAndResolve() {
            const promise = condition();
            promise.succeed(200);
            assertEquality({
                "promise.done": {
                    value: promise.done,
                    shouldBe: true
                },
                "resolved to": {
                    value: await promise,
                    shouldBe: 200
                }
            });
        }
    }, {
        subject: referenceCondition.fail,
        execute: async function createAndReject() {
            const promise = condition();
            promise.fail(400);
            await assertFailure({
                name: "promise",
                execute: promise,
                shouldThrow: 400
            });
            assertEquality({
                "promise.done": {
                    value: promise.done,
                    shouldBe: true
                }
            });
        }
    },{
        subject: condition,
        execute: async function registeredConditions() {
            await assertFailure({
                name: "not yet registered condition",
                execute: condition("debug.test.condition1"),
                shouldThrow: "unregistered condition: \"debug.test.condition1\""
            });

            let promise = condition({
                timeLimit: 1000,
                registerWithName: "debug.test.condition1"
            });
            setTimeout(promise.succeed,100);
            assertEquality({
                "successfull registered condition": {
                    value: await condition("debug.test.condition1"),
                    shouldBe: undefined
                }
            });

            promise = condition({
                timeLimit: 0,
                registerWithName: "debug.test.condition2"
            });
            await assertFailure({
                name: "outtimed registered condition",
                execute: condition("debug.test.condition2"),
                shouldThrow: "timeout"
            });

            promise = condition({
                timeLimit: 1000,
                registerWithName: "debug.test.condition3"
            });
            promise.fail("testCondition3 failure");
            await assertFailure({
                name: "outtimed registered condition",
                execute: condition("debug.test.condition3"),
                shouldThrow: "testCondition3 failure"
            });

            assertEquality({
                "remember previous valid condition": {
                    value: await condition("debug.test.condition1"),
                    shouldBe: undefined
                }
            });
        }
    });
})();