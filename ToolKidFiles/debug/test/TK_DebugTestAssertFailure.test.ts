(function TK_DebugTest_test() {
    const Debug = ToolKid.debug;
    const { assertFailure, assertEquality, test } = Debug.test;



    test({
        subject: assertFailure,
        execute: function notFailing() {
            try {
                assertFailure({
                    name: "empty function",
                    execute: function () { }
                });
                throw ["basicFailure din't throw"];
            } catch (error) { }
        }
    }, {
        subject: assertFailure,
        execute: function expectedFailure() {
            assertFailure({
                name: "missing inputs",
                execute: function () {
                    assertFailure({
                        name: "missing inputs call",
                        execute: <any>undefined
                    });
                },
                shouldThrow: ["~ missing inputs call ~ execute is not a function, instead is:", undefined]
            }, {
                name: "crashing function",
                execute: function () {
                    (<any>Debug).broken.unitTest();
                },
                shouldThrow: Error
            });
        }
    });

    //---- promises
    test({
        subject: assertFailure,
        execute: async function rejectedPromise() {
            await assertFailure({
                name: "failing promise",
                execute: function () {
                    return Promise.reject("because");
                },
                shouldThrow: "because"
            });
        }
    }, {
        subject: assertFailure,
        execute: async function rejectedDirectPromise() {
            await assertFailure({
                name: "failing direct promise",
                execute: Promise.reject("because2"),
                shouldThrow: "because2"
            });
        }
    }, {
        subject: assertFailure,
        execute: async function rejectedPromiseWrongReason() {
            await (<Promise<any>>assertFailure({
                name: "failing promise",
                execute: function () {
                    return Promise.reject("because");
                },
                shouldThrow: "why not"
            })).then(function () {
                throw "din't fail";
            }).catch(function (reason) {
                assertEquality({
                    "error from wrong reason": {
                        value: reason,
                        shouldBe: [
                            "~ failing promise ~ did not throw expected message. threw:",
                            "because",
                            "  instead of:",
                            "why not"
                        ]
                    }
                });
            });
        }
    }, {
        subject: assertFailure,
        execute: async function resolvedPromiseWhichThrowsLater() {
            await assertFailure({
                name: "promise successfull but then fails",
                execute: function () {
                    return Promise.resolve(100)
                        .then(function () {
                            throw 200;
                        });
                },
                shouldThrow: 200
            });
        }
    }, {
        subject: assertFailure,
        execute: async function resolvedPromise() {
            await (<Promise<any>>assertFailure({
                name: "successfull promise",
                execute: function () {
                    return Promise.resolve();
                }
            })).catch(function (reason) {
                assertEquality({
                    "error from not failing": {
                        value: reason,
                        shouldBe: ["~ successfull promise ~ promise did not reject as expected"]
                    }
                });
            });
        }
    });
})();