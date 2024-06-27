(function TK_DebugTestResults_test() {
    const Debug = ToolKid.debug.test;
    const { assertEquality, getSummary, shouldPass, test } = Debug;



    const testResults = <(TestResult | Promise<TestResult>)[]>[];

    const isNumber = function isNumber (value:any) {
        return typeof value === "number" && !Number.isNaN(value);
    };

    const isSet = function isSet (value:any) {
        return value instanceof Set;
    };

    let initalSummary: TestSummary;
    testResults.push(...test({
        subject: getSummary,
        execute: function currentSummary() {
            initalSummary = Debug.getSummary();
            assertEquality({
                "initial summary":{
                    value: initalSummary,
                    shouldBe: {
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
    }));

    let saveStateID: number;
    testResults.push(...test({
        subject: Debug.saveSummaryState,
        execute: function basic() {
            saveStateID = Debug.saveSummaryState();
            assertEquality({
                "saveStateID": {
                    value: saveStateID,
                    shouldBe: shouldPass(isNumber)
                }
            });
        }
    }));

    testResults.push(...test({
        subject: Debug.registerTestResult,
        execute: function basic() {
            const dummyResult = {
                subject: Debug.registerTestResult,
                name: Debug.registerTestResult.name,
                time: 0
            };
            const oldSummary = getSummary();
            Debug.registerTestResult(dummyResult, dummyResult);
            const newSummary = getSummary();
            assertEquality({
                "new testCount (+2)": {
                    value: newSummary.testCount,
                    shouldBe: oldSummary.testCount + 2
                }
            });
            const successes = <any[]>newSummary.successes.get(Debug.registerTestResult);
            assertEquality({
                "last stored result": {
                    value: successes[successes.length - 1],
                    shouldBe: { name: Debug.registerTestResult.name, time: 0 }
                }
            });
        }
    }));

    testResults.push(...test({
        subject: Debug.registerTestSuspect,
        execute: function basic() {
            const a = { a: function () { }, b: function () { } };
            const oldSummary = getSummary();
            Debug.registerTestSuspect(a);
            let newSummary = getSummary();
            assertEquality({
                "missingSuspect": {
                    value: newSummary.missingSuspects.size,
                    shouldBe: oldSummary.missingSuspects.size + 1
                }
            });
            Debug.registerTestSuspect({
                suspect: a,
                mode: "allMethods"
            });
            newSummary = getSummary();
            assertEquality({
                "missingSuspect": {
                    value: newSummary.missingSuspects.size,
                    shouldBe: oldSummary.missingSuspects.size + 3
                }
            });
        }
    }));

    testResults.push(...test({
        subject: Debug.clearSummaryState,
        execute: function basic() {
            Debug.clearSummaryState();
            assertEquality({
                "testCount": {
                    value: getSummary().testCount,
                    shouldBe: 0
                }
            });
        }
    }));

    test({
        subject: Debug.loadSummaryState,
        execute: function loadSummary() {
            Debug.loadSummaryState(saveStateID);
            const summary = getSummary();
            initalSummary.successes.set(
                getSummary,
                <any>summary.successes.get(getSummary)
            );
            initalSummary.missingSuspects.delete(
                getSummary
            );
            summary.timeTotal = initalSummary.timeTotal;
            summary.testCount -= 1;
            assertEquality({
                "loaded summary": {
                    value: summary,
                    shouldBe: initalSummary,
                    toleranceDepth: 10
                }
            });
            Debug.registerTestResult(...testResults);
        }
    });
})();