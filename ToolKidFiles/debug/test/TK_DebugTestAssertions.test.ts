(function TK_DebugTest_test() {
    const Debug = ToolKid.debug;
    const { assertFailure, assertEquality, createPromise, test } = Debug.test;



    test({
        subject: assertEquality,
        execute: function basicFailure() {
            try {
                assertEquality({
                    "basicFailure":{
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
                "number":{
                    value: 10, 
                    shouldBe: 10
                },
                "boolean":{
                    value: true, 
                    shouldBe: true
                },
                "text":{
                    value: "text", 
                    shouldBe: "text"
                },
                "null":{
                    value: null, 
                    shouldBe: null
                }
            });
        }
    }, {
        subject: assertEquality,
        execute: function trickyEquality() {
            assertEquality({
                "NaN":{
                    value: NaN,
                    shouldBe: NaN
                },
                "object":{
                    value: {},
                    shouldBe: {}
                },
                "array":{
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
                "identical objects":{
                    value: testObject,
                    shouldBe: testObject,
                    toleranceDepth: 0
                },
                "identical arrays":{
                    value: testArray,
                    shouldBe: testArray,
                    toleranceDepth: 0
                }
            });
            assertFailure({
                name: "equal but not identical objects",
                execute: assertEquality,
                withInputs: {
                    name: "object", value: {}, shouldBe: testObject, toleranceDepth: 0
                },
                shouldThrow: ["~ object ~ value is:", {}, "but should be identical with:", {}]
            }, {
                name: "equal but not identical arrays",
                execute: assertEquality,
                withInputs: {
                    name: "object", value: [1], shouldBe: testArray, toleranceDepth: 0
                },
                shouldThrow: ["~ object ~ value is:", [1], "but should be identical with:", [1]]
            });
        }
    });

    test({
        subject: assertFailure,
        execute: function notFailing () {
            try {
                assertFailure({
                    name: "empty function",
                    execute: function () {}
                });
                throw ["basicFailure din't throw"];
            } catch (error) {}
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
                execute:function () {
                    return Promise.reject("because");
                },
                shouldThrow: "because"
            });
        }
    },{
        subject: assertFailure,
        execute: async function rejectedDirectPromise() {
            await assertFailure({
                name: "failing direct promise",
                execute:Promise.reject("because2"),
                shouldThrow: "because2"
            });
        }
    },{
        subject: assertFailure,
        execute: async function rejectedPromiseWrongReason() {
            await (<Promise<any>>assertFailure({
                name: "failing promise",
                execute:function () {
                    return Promise.reject("because");
                },
                shouldThrow: "why not"
            })).then(function(){
                throw "din't fail";
            }).catch(function(reason) {
                assertEquality({
                    "error from wrong reason":{
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
    },{
        subject: assertFailure,
        execute: async function resolvedPromiseWhichThrowsLater () {
            await assertFailure({
                name:"promise successfull but then fails",
                execute: function () {
                    return Promise.resolve(100)
                        .then(function(){
                            throw 200;
                        });
                },
                shouldThrow: 200
            });
        }
    },{
        subject: assertFailure,
        execute: async function resolvedPromise() {
            await (<Promise<any>>assertFailure({
                name: "successfull promise",
                execute: function () {
                    return Promise.resolve();
                }
            })).catch(function(reason) {
                assertEquality({
                    "error from not failing":{
                        value: reason,
                        shouldBe: [ "~ successfull promise ~ promise did not reject as expected" ]
                    }
                });
            });
        }
    });

    const referencePromise = createPromise();
    test({
        subject: createPromise,
        execute: async function createAndResolve () {
            const promise = createPromise();
            assertEquality({
                "promise is instanceof Promise":{
                    value: promise instanceof Promise,
                    shouldBe: true
                },
                "promise.done":{
                    value: promise.done,
                    shouldBe: undefined
                },
                "typeof promise.resolve": {
                    value: typeof promise.resolve,
                    shouldBe: "function"
                },
                "typeof promise.reject": {
                    value: typeof promise.reject,
                    shouldBe: "function"
                }
            });
        }
    },{
        subject: referencePromise.resolve,
        execute: async function createAndResolve () {
            const promise = createPromise();
            promise.resolve(200);
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
    },{
        subject: referencePromise.reject,
        execute: async function createAndReject () {
            const promise = createPromise();
            promise.reject(400);
            await assertFailure({
                name:"promise",
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
    });
})();