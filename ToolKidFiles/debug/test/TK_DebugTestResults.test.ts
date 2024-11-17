(function TK_DebugTestResults_test() {
    const Debug = ToolKid.debug.test;
    const { assertEquality, getSummary, shouldPass, test } = Debug;



    const isNumber = function isNumber (value:any) {
        return typeof value === "number" && !Number.isNaN(value);
    };

    const isSet = function isSet (value:any) {
        return value instanceof Set;
    };

    test({
        subject: getSummary,
        execute: function validCurrentSummary() {
            assertEquality({
                "initial summary":{
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

    const currentSummary = getSummary();
    Debug.selectResultGroup("TK_DebugTestResults");
    test({
        subject: getSummary,
        execute: function clearSummaryState() {
            assertEquality({
                "clean summary": {
                    value: getSummary(),
                    shouldBe: {
                        name: "default",
                    },
                    toleranceDepth: 3
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

    Debug.selectResultGroup(currentSummary.name);
    test({
        subject: getSummary,
        execute: function summaryAfterSwitchingBack() {
            assertEquality({
                "summary din't change after switching": {
                    value: getSummary(),
                    shouldBe: currentSummary,
                    toleranceDepth: 4
                }
            });
            // TODO: repair getSummary so the test passes
            // assertEquality({
            //     "loaded summary": {
            //         value: summary,
            //         shouldBe: initalSummary,
            //         toleranceDepth: 10
            //     }
            // });
        }
    });
})();