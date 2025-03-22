(function TK_DataTypesChecks_test() {
    const { test, assertEquality } = ToolKid.debug.test;
    const { iterateBatch } = ToolKid.dataTypes.array;
    const { createPromise } = ToolKid.dataTypes.promise;



    const register = function (storage: any[], ...inputs: any[]) {
        storage.push(inputs);
    };

    test({
        subject: iterateBatch,
        execute: function batchSize1() {
            const promise = createPromise();
            const inputStack = <any[]>[];
            iterateBatch({
                data: ["a", "b", "c", "d"],
                parser: register.bind(null, inputStack),
                batchSize: 1,
                callback: function (lastIndex) {
                    assertEquality({
                        "lastIndex": {
                            value: lastIndex, shouldBe: 3,
                            catchFailure: promise.reject,
                        },
                        "batchSize 1": {
                            value: inputStack, shouldBe: [
                                ["a", 0],
                                ["break"],
                                ["b", 1],
                                ["c", 2],
                                ["d", 3]
                            ],
                            toleranceDepth: 3,
                            catchFailure: promise.reject,
                        }
                    });
                    promise.resolve();
                }
            });

            register(inputStack, "break");

            return promise.promise;
        }
    }, {
        subject: iterateBatch,
        execute: function batchSize3() {
            const promise = createPromise();
            const inputStack = <any[]>[];
            iterateBatch({
                data: ["a", "b", "c", "d"],
                parser: register.bind(null, inputStack),
                batchSize: 3,
                callback: function (lastIndex) {
                    assertEquality({
                        "lastIndex": {
                            value: lastIndex, shouldBe: 3,
                            catchFailure: promise.reject,
                        },
                        "batchSize 3": {
                            value: inputStack, shouldBe: [
                                ["a", 0], ["b", 1], ["c", 2],
                                ["break"],
                                ["d", 3]
                            ],
                            toleranceDepth: 3,
                            catchFailure: promise.reject,
                        }
                    });
                    promise.resolve();
                }
            });

            register(inputStack, "break");

            return promise.promise;
        }
    }, {
        subject: iterateBatch,
        execute: function stopped() {

            const promise = createPromise();
            const inputStack = <any[]>[];
            iterateBatch({
                data: ["a", "b", "c", "d"],
                parser: function (...inputs): any {
                    register(inputStack, ...inputs);
                    if (inputs[1] !== 0) {
                        return "stop";
                    }
                },
                stopSignal: "stop",
                batchSize: 3,
                callback: function (lastIndex) {
                    // happening before the break
                    assertEquality({
                        "lastIndex": {
                            value: lastIndex, shouldBe: 1,
                            catchFailure: promise.reject,
                        },
                        "stopped": {
                            value: inputStack, shouldBe: [
                                ["a", 0], ["b", 1]
                            ],
                            toleranceDepth: 3,
                            catchFailure: promise.reject,
                        }
                    });
                    setTimeout(function () {
                        // happening after break
                        assertEquality({
                            "lastIndex later": {
                                value: lastIndex, shouldBe: 1,
                                catchFailure: promise.reject,
                            },
                            "stopped later": {
                                value: inputStack, shouldBe: [
                                    ["a", 0], ["b", 1],
                                    ["break"]
                                ],
                                toleranceDepth: 3,
                                catchFailure: promise.reject,
                            }
                        });
                        promise.resolve();
                    }, 100);
                }
            });

            register(inputStack, "break");

            return promise.promise;
        }
    });
})();