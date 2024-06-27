(function TK_DebugTest_test() {
    const Debug = ToolKid.debug;
    const { assertFailure, assertEquality, shouldPass, test } = Debug.test;



    const isNumber = function (value:any) {return typeof value === "number" && !Number.isNaN(value)};
    const isString = function (value:any) {return typeof value === "string" && value.length !== 0};



    test({
        subject: assertEquality,
        execute: function simpleValues() {
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
                },"undefined": {
                    value: undefined,
                    shouldBe: undefined
                }
            });
        }
    }, {
        subject: assertEquality,
        execute: function fail_simpleValues() {
            assertFailure({
                name: "boolean",
                execute: assertEquality,
                withInputs: {
                    "boolean": {
                        value: true,
                        shouldBe: false
                    }
                }
            },{
                name: "falsy",
                execute: assertEquality,
                withInputs: {
                    "falsy": {
                        value: undefined,
                        shouldBe: null
                    }
                }
            });
        }
    },{
        subject: assertEquality,
        execute: function specialValues() {
            assertEquality({
                "NaN": {
                    value: NaN,
                    shouldBe: NaN
                }, "object": {
                    value: {number:100},
                    shouldBe: {number:100}
                }, "array": {
                    value: [1,2,3],
                    shouldBe: [1,2,3]
                }, "map": {
                    value: new Map(<any>[["text","bla"],[10,100]]),
                    shouldBe: new Map(<any>[["text","bla"],[10,100]])
                }, "set": {
                    value: new Set([1, true, "text"]),
                    shouldBe: new Set([true, 1, true, "text"])
                }
            });
        }
    }, {
        subject: assertEquality,
        execute: function fail_specialValues() {
            assertFailure({
                name: "fail extended object",
                execute: assertEquality,
                withInputs: {
                    "fail extended object": {
                        value: { text: "bla", number: 100 },
                        shouldBe: { text: "bla" }
                    }
                }
            }, {
                name: "fail extended map",
                execute: assertEquality,
                withInputs: {
                    "fail extended map": {
                        value: new Map(<any>[["text","bla"],[10,100]]),
                        shouldBe: new Map(<any>[["text","bla"]])
                    }
                }
            }, {
                name: "fail extended set",
                execute: assertEquality,
                withInputs: {
                    "fail extended map": {
                        value: new Set([1,true,"text"]),
                        shouldBe: new Set([1,true,"text",{}]),
                        toleranceDepth: 2
                    }
                }
            }, {
                name: "fail map with non-identical special keys",
                execute: assertEquality,
                withInputs: {
                    "fail map with non-identical special keys": {
                        value: new Map(<any>[[{},true]]),
                        shouldBe: new Map(<any>[[{},true]])
                    }
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
        }
    }, {
        subject: assertEquality,
        execute: function fail_strictIdentity() {
            assertFailure({
                name: "equal but not identical objects",
                execute: assertEquality,
                withInputs: {
                    "object": {
                        value: {},
                        shouldBe: {},
                        toleranceDepth: 0
                    }
                }
            }, {
                name: "equal but not identical arrays",
                execute: assertEquality,
                withInputs: {
                    "object": {
                        value: [1],
                        shouldBe: [1],
                        toleranceDepth: 0
                    }
                }
            }, {
                name: "equal but not identical maps",
                    execute: assertEquality,
                    withInputs: {
                        "object": {
                            value: new Map(<any>[["text","bla"],[10,100]]),
                            shouldBe: new Map(<any>[["text","bla"],[10,100]]),
                            toleranceDepth: 0
                        }
                    }
                });
        }
    }, {
        subject: assertEquality,
        execute: function looseComparison() {
            const testObject = { text: "bla" };
            assertEquality({
                "identical object": {
                    value: testObject,
                    shouldBe: testObject,
                    allowAdditions: true
                }, "equal object": {
                    value: { text: "bla" },
                    shouldBe: testObject,
                    allowAdditions: true
                }, "extended object": {
                    value: { text: "bla", number: 100 },
                    shouldBe: testObject,
                    allowAdditions: true
                }, "deeply extended": {
                    value: { number: 100, sub: { bonus: true, text: "bla" } },
                    shouldBe: { sub: testObject },
                    allowAdditions: true,
                    toleranceDepth: 2
                }
            });
        }
    }, {
        subject: assertEquality,
        execute: function fail_looseComparison() {
            const testObject = { text: "bla" };
            assertFailure({
                name: "value missing flat property",
                execute: assertEquality,
                withInputs: {
                    "fail1": {
                        value: { number: 100 },
                        shouldBe: testObject,
                        allowAdditons: true
                    }
                }
            }, {
                name: "value missing deep property",
                execute: assertEquality,
                withInputs: {
                    "fail2": {
                        value: { number: 100, sub: { bonus: true } },
                        shouldBe: { sub: testObject },
                        allowAdditons: true
                    }
                }
            }, {
                name: "equality not deep enough",
                execute: assertEquality,
                withInputs: {
                    "fail3": {
                        value: { number: 100, sub: { bonus: true, text: "bla" } },
                        shouldBe: { sub: testObject },
                        allowAdditons: true,
                        toleranceDepth: 1
                    }
                }
            });
        }
    });

    test({
        subject: shouldPass,
        execute: function basicSuccess () {
            assertEquality({
                "valid object 1": {
                    value: {
                        boolean: true,
                        extra: [],
                        number:10,
                        text: "testText"
                    },
                    shouldBe: {
                        boolean: true,
                        number: shouldPass(isNumber),
                        text: shouldPass(isString)
                    },
                    allowAdditions: true
                },
                "valid object 2": {
                    value: {
                        boolean: false,
                        extra: {},
                        number: 0,
                        text: "another text"
                    },
                    shouldBe: {
                        boolean:false,
                        number: shouldPass(isNumber),
                        text: shouldPass(isString)
                    },
                    allowAdditions: true
                }
            });
        }
    },{
        subject: shouldPass,
        execute: function fail_basic() {
            assertFailure({
                name:"wrong value",
                execute: assertEquality,
                withInputs:{
                    "broken value": {
                        value: {
                            text: 10
                        },
                        shouldBe: {
                            text: shouldPass(isString)
                        },
                        allowAdditions: true
                    },
                }
            },{
                name:"unprepared valueChecker",
                execute: assertEquality,
                withInputs:{
                    "broken check": {
                        value: {
                            text: "text"
                        },
                        shouldBe: {
                            text: isString
                        },
                        allowAdditions: true
                    },
                }
            });
        }
    });
})();