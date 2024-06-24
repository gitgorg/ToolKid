(function TK_DataTypesPromise_test() {



    const { test, assertEquality, assertFailure } = ToolKid.debug.test;
    const { combine, createPromise } = ToolKid.dataTypes.promise;


    test({
        subject: createPromise,
        execute: async function basic() {
            let result = createPromise();
            result.resolve(100);
            assertEquality({
                "result.promise is promise": {
                    value: result.promise instanceof Promise,
                    shouldBe: true
                }, "result.resolve is function": {
                    value: typeof result.resolve === "function",
                    shouldBe: true
                }, "result.reject is function": {
                    value: typeof result.reject === "function",
                    shouldBe: true
                }, "result.value": {
                    value: await result.promise,
                    shouldBe: 100
                }
            });

            result = createPromise();
            result.reject(false);
            await assertFailure({
                name: "promise was rejected",
                execute: result.promise,
                shouldThrow: false
            });
        }
    });

    test({
        subject: combine,
        execute: async function bothPositive() {
            assertEquality({
                "value": {
                    value: await combine(Promise.resolve("a"),Promise.resolve("b")),
                    shouldBe: ["a","b"]
                }
            });
        }
    },{
        subject: combine,
        execute: async function positiveNegative() {
            await assertFailure({
                name: "positive and negative",
                execute: combine(Promise.resolve("c"),Promise.reject("d")),
                shouldThrow: "d"
            });
        }
    },{
        subject: combine,
        execute: async function bothNetative() {
            await assertFailure({
                name: "positive and negative",
                execute: combine(Promise.reject("e"),Promise.reject("f")),
                shouldThrow: "e"
            });
        }
    });
})();