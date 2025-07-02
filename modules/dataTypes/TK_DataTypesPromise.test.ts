(function TK_DataTypesPromise_test() {
    const { assertEquality, assertFailure, shouldPass, test } = ToolKid.debug.test;
    const { combinePromises, createPromise } = ToolKid.dataTypes.promise;



    const isFunction = function (value: any) {
        return typeof value === "function";
    };
    const isPromise = function (value: any) {
        return value instanceof Promise;
    };



    test({
        subject: createPromise,
        execute: async function simplePromise() {
            let result = createPromise();
            result.resolve(100);
            let value = await result.promise;
            assertEquality({
                "result": {
                    value: result,
                    shouldBe: {
                        promise: shouldPass(isPromise),
                        resolve: shouldPass(isFunction),
                        reject: shouldPass(isFunction),
                        state: "fulfilled",
                        data: 100
                    }
                },
                "awaited result.promise": {
                    value,
                    shouldBe: 100
                }
            });

            result = createPromise();
            result.reject(false);
            value = await assertFailure({
                name: "promise was rejected",
                execute: result.promise,
                shouldThrow: false
            });
        }
    });

    test({
        subject: combinePromises,
        execute: async function bothPositive() {
            assertEquality({
                "both positive": {
                    value: await combinePromises(
                        Promise.resolve("a"), Promise.resolve("b")
                    ),
                    shouldBe: ["a", "b"]
                }
            });
        }
    }, {
        subject: combinePromises,
        execute: async function fail_positiveNegative() {
            await assertFailure({
                name: "positive and negative",
                execute: combinePromises(Promise.resolve("c"), Promise.reject("d")),
                shouldThrow: "d"
            });
        }
    }, {
        subject: combinePromises,
        execute: async function fail_bothNetative() {
            await assertFailure({
                name: "both negative",
                execute: combinePromises(Promise.reject("e"), Promise.reject("f")),
                shouldThrow: "e"
            });
        }
    });
})();