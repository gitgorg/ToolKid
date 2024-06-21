(function TK_DebugTest_test() {
    const Debug = ToolKid.debug;
    const { assertFailure, assertEquality, condition, test } = Debug.test;



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