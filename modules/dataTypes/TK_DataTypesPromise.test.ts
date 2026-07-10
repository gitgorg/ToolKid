(function TK_DataTypesPromise_test() {
    const { assertEquality, assertFailure, shouldPass, test } = ToolKid.debug.test;
    const { combinePromises, createPromise } = ToolKid.dataTypes.promise;



    const shouldBeFunction = shouldPass(function (value: any) {
        return typeof value === "function";
    });
    const shouldBePromise = shouldPass(function (value: any) {
        return value instanceof Promise;
    });
    const shouldBeString = shouldPass(function (value: any) {
        return typeof value === "string" && value.length !== 0;
    });



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
                        promise: shouldBePromise,
                        resolve: shouldBeFunction,
                        reject: shouldBeFunction,
                        state: "fulfilled",
                        data: 100,
                        origin: shouldBeString,
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