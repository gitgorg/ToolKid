(function TK_DebugTest_test() {
    const { assertFailure, assertEquality, condition, shouldPass, test } = ToolKid.debug.test;


    const isFunction = function (value: any) {
        return typeof value === "function";
    };
    const isNumber = function (value: any) {
        return typeof value === "number" && !Number.isNaN(value);
    }
    const isPromise = function (value: any) {
        return value instanceof Promise;
    };



    const referenceCondition = condition();
    test({
        subject: referenceCondition.resolve,
        execute: async function createAndResolve() {
            const promise = condition();
            assertEquality({
                "should be Promise": {
                    value: promise,
                    shouldBe: shouldPass(isPromise)
                },
                "promise.done": {
                    value: promise.done,
                    shouldBe: false
                },
                "promise.timePassed": {
                    value: promise.timePassed,
                    shouldBe: 0
                },
                "promise.resolve": {
                    value: promise.resolve,
                    shouldBe: shouldPass(isFunction)
                },
                "promise.fail": {
                    value: promise.reject,
                    shouldBe: shouldPass(isFunction)
                }
            });
            promise.resolve(200);
            assertEquality({
                "promise.done": {
                    value: promise.done,
                    shouldBe: true
                },
                // "promise.timePassed": {
                //     value: promise.timePassed,
                //     shouldBe: 0
                // },
                "resolved to": {
                    value: await promise,
                    shouldBe: 200
                }
            });
        }
    }, {
        subject: referenceCondition.reject,
        execute: async function createAndReject() {
            const promise = condition();
            promise.reject(400);
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
    }, {
        subject: condition,
        execute: async function registeredConditions() {
            await assertFailure({
                name: "not yet registered condition",
                execute: condition("debug.test.condition1"),
                shouldThrow: "unregistered condition: \"debug.test.condition1\""
            });

            let promise = condition({
                timeToReject: 1000,
                registerWithName: "debug.test.condition1",
            });
            setTimeout(promise.resolve, 100);
            assertEquality({
                "successfull registered condition": {
                    value: await condition("debug.test.condition1"),
                    shouldBe: shouldPass(isNumber),
                }
            });

            promise = condition({
                timeToReject: 0,
                registerWithName: "debug.test.condition2"
            });
            await assertFailure({
                name: "outtimed registered condition",
                execute: condition("debug.test.condition2"),
                shouldThrow: "timeout"
            });

            promise = condition({
                timeToReject: 1000,
                registerWithName: "debug.test.condition3"
            });
            promise.reject("testCondition3 failure");
            await assertFailure({
                name: "outtimed registered condition",
                execute: condition("debug.test.condition3"),
                shouldThrow: "testCondition3 failure"
            });

            assertEquality({
                "remember previous valid condition": {
                    value: await condition("debug.test.condition1"),
                    shouldBe: shouldPass(isNumber)
                }
            });
        }
    });
})();