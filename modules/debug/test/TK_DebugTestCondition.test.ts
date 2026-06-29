(function TK_DebugTest_test() {
    const { assertFailure, assert, createCondition, condition, shouldPass, test } = ToolKid.debug.test;


    const shouldBeFunction = shouldPass(
        value => typeof value === "function"
    );
    const shouldBeNumber = shouldPass(
        value => typeof value === "number" && !Number.isNaN(value)
    );
    const shouldBeString = shouldPass(
        value => typeof value === "string" && value.length !== 0
    );



    const referenceCondition = createCondition();
    test({
        subject: referenceCondition.resolve,
        execute: async function createAndResolve() {
            const promise = createCondition();
            let copy = Object.assign({}, promise);
            assert({
                CONFIG: { toleranceDepth: 3 },
                isPromise: {
                    value: promise instanceof Promise,
                    shouldBe: true,
                },
                "properties initial": {
                    value: copy,
                    shouldBe: {
                        done: false,
                        timePassed: 0,
                        resolve: shouldBeFunction,
                        reject: shouldBeFunction,
                        origin: shouldBeString,
                    }
                },

            });

            promise.resolve(200);
            copy = Object.assign({}, promise);
            assert({
                CONFIG: { toleranceDepth: 3 },
                "properties after resolve": {
                    value: copy,
                    shouldBe: {
                        done: true,
                        timePassed: ToolKid.debug.test.shouldPassAny(0,1),
                        resolve: shouldBeFunction,
                        reject: shouldBeFunction,
                        origin: shouldBeString,
                    }
                },
                value: {
                    value: await promise,
                    shouldBe: 200,
                }
            });
        }
    }, {
        subject: referenceCondition.reject,
        execute: async function createAndReject() {
            const promise = createCondition();
            promise.reject(400);
            await assertFailure({
                name: "promise",
                execute: promise,
                shouldThrow: 400
            });
            assert({
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
                name: "unknown condition",
                execute: condition("debug.test.conditionNever")
            });
        }
    }, {
        subject: createCondition,
        execute: async function registeredConditions() {
            let promise = createCondition({
                timeToReject: 1000,
                registerWithName: "debug.test.condition1",
            });
            setTimeout(promise.resolve, 100);
            assert({
                "successfull registered condition": {
                    value: await condition("debug.test.condition1"),
                    shouldBe: shouldBeNumber,
                }
            });

            promise = createCondition({
                timeToReject: 0,
                registerWithName: "debug.test.condition2"
            });
            await assertFailure({
                name: "outtimed registered condition",
                execute: condition("debug.test.condition2"),
            });

            promise = createCondition({
                timeToReject: 1000,
                registerWithName: "debug.test.condition3"
            });
            promise.reject("testCondition3 failure");
            await assertFailure({
                name: "outtimed registered condition",
                execute: condition("debug.test.condition3"),
                shouldThrow: "testCondition3 failure"
            });

            assert({
                "remember previous valid condition": {
                    value: await condition("debug.test.condition1"),
                    shouldBe: shouldBeNumber
                }
            });
        }
    });
})();