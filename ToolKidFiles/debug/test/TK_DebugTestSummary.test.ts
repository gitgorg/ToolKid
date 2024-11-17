(function TK_DebugTestSummary_test() {
    const Debug = ToolKid.debug.test;
    const { assertEquality, getSummary, registerTestSuspect, shouldPass, SWITCH_RESULT_GROUP, test } = Debug;



    const isNumber = function isNumber(value: any) {
        return typeof value === "number" && !Number.isNaN(value);
    };

    const isSet = function isSet(value: any) {
        return value instanceof Set;
    };



    test({
        subject: getSummary,
        execute: function validCurrentSummary() {
            assertEquality({
                "initial summary": {
                    value: getSummary(),
                    shouldBe: {
                        name: "default",
                        failures: shouldPass((value) => value instanceof Array),
                        missingSuspects: shouldPass(isSet),
                        pending: shouldPass(isSet),
                        successes: shouldPass((value) => value instanceof Map),
                        testCount: shouldPass(isNumber),
                        timeTotal: shouldPass(isNumber)
                    }
                }
            });
        }
    });



    // switching to separate testGroup to not mess up results
    const currentSummary = getSummary();
    SWITCH_RESULT_GROUP("TK_DebugTestSummary");



    const dummySuspect = { name: "dummySuspect" };
    const separateResults = test({
        subject: SWITCH_RESULT_GROUP,
        execute: function cleanSummary() {
            assertEquality({
                "clean summary": {
                    value: getSummary(),
                    shouldBe: {
                        name: "TK_DebugTestSummary",
                        testCount: 0,
                        timeTotal: shouldPass(isNumber),
                        failures: [],
                        successes: new Map(),
                        pending: [],
                        missingSuspects: new Set()
                    },
                    toleranceDepth: 3
                }
            });
        }
    },{
        subject: registerTestSuspect,
        execute: function missingSuspects() {
            registerTestSuspect(dummySuspect);
            assertEquality({
                ".missingSuspects": {
                    value: getSummary().missingSuspects,
                    shouldBe: new Set()
                }
            });
        }
    });

    // test({
    //     subject: Debug.registerTestResult,
    //     execute: function basic() {
    //         const dummyResult = {
    //             subject: Debug.registerTestResult,
    //             name: Debug.registerTestResult.name,
    //             time: 0
    //         };
    //         const oldSummary = getSummary();
    //         Debug.registerTestResult(dummyResult, dummyResult);
    //         const newSummary = getSummary();
    //         assertEquality({
    //             "new testCount (+2)": {
    //                 value: newSummary.testCount,
    //                 shouldBe: oldSummary.testCount + 2
    //             }
    //         });
    //         const successes = <any[]>newSummary.successes.get(Debug.registerTestResult);
    //         assertEquality({
    //             "last stored result": {
    //                 value: successes[successes.length - 1],
    //                 shouldBe: { name: Debug.registerTestResult.name, time: 0 }
    //             }
    //         });
    //     }
    // });

    // test({
    //     subject: Debug.registerTestSuspect,
    //     execute: function basic() {
    //         const a = { a: function () { }, b: function () { } };
    //         const oldSummary = getSummary();
    //         Debug.registerTestSuspect(a);
    //         let newSummary = getSummary();
    //         assertEquality({
    //             "1 missing suspect": {
    //                 value: newSummary.missingSuspects.size,
    //                 shouldBe: oldSummary.missingSuspects.size + 1
    //             }
    //         });
    //         Debug.registerTestSuspect({
    //             suspect: a,
    //             mode: "allMethods"
    //         });
    //         newSummary = getSummary();
    //         assertEquality({
    //             "3 missing suspects": {
    //                 value: newSummary.missingSuspects.size,
    //                 shouldBe: oldSummary.missingSuspects.size + 3
    //             }
    //         });
    //     }
    // });



    // switching back to main testGroup to not mess up results
    SWITCH_RESULT_GROUP(currentSummary.name);



    test({
        subject: SWITCH_RESULT_GROUP,
        execute: function summarySwitching() {
            assertEquality({
                "switch cleared summary": {
                    value: separateResults[0],
                    shouldBe: {
                        subject: SWITCH_RESULT_GROUP,
                        name: "cleanSummary",
                        time: 0
                    }
                }
            });
            assertEquality({
                "summary din't change after switching": {
                    value: getSummary(),
                    shouldBe: currentSummary,
                    toleranceDepth: 4
                }
            });
        }
    });

    test({
        subject: registerTestSuspect,
        execute: function testSuspects() {
            assertEquality({
                "separateResult.1": {
                    value: separateResults[1],
                    shouldBe: {
                        subject: registerTestSuspect,
                        name: "missingSuspects",
                        time: 0,
                        errorMessage: shouldPass(function(message){
                            return message instanceof Array && typeof message[0] === "string";
                        })
                    },
                    toleranceDepth: 4
                }
            });
        }
    });
})();