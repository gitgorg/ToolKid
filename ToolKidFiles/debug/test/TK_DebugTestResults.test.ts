(function TK_DebugTestResults_test() {
    const Debug = ToolKid.debug.test;
    const { getSummary, test, assertEquality } = Debug;



    const testResults = <(TestResult | Promise<TestResult>)[]>[];

    let initalSummary: TestSummary;
    testResults.push(...test({
        subject: getSummary,
        execute: function basic() {
            initalSummary = Debug.getSummary();
            assertEquality({
                ".testCount is number": {
                    value: typeof initalSummary.testCount === "number",
                    shouldBe: true
                },
                ".failures is array": {
                    value: initalSummary.failures instanceof Array,
                    shouldBe: true
                },
                ".successes is map": {
                    value: initalSummary.successes instanceof Map,
                    shouldBe: true
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
                "returns number": {
                    value: typeof saveStateID === "number",
                    shouldBe: true
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
            //log(successes)
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
        execute: function basic() {
            Debug.loadSummaryState(saveStateID);
            const summary = getSummary();
            summary.timeTotal = initalSummary.timeTotal;
            summary.testCount -= 1;
            assertEquality({
                "loaded summary": {
                    value: summary, shouldBe: initalSummary
                }
            });
            Debug.registerTestResult(...testResults);
        }
    });
})();