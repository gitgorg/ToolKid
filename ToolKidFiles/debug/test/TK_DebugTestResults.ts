//collecting automated test results
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    // result
    registerTestResult(
        ...results: (TestResult | Promise<TestResult>)[]
    ): void,

    // suspect
    registerTestSuspect(
        ...inputs: any[]
    ): void,
    registerTestSuspect(inputs: {
        suspect: any | any[],
        mode: "allMethods"
    }): void,

    // summary
    getSummary(
        callback?: (summary: TestSummary) => void
    ): TestSummary,
    clearSummaryState(inputs?: {
        clearSuspects?: true
    }): void,
    saveSummaryState(): number,
    loadSummaryState(
        stateID: number
    ): void
}

type TestSummary = {
    testCount: number,
    timeTotal: number,
    failures: TestResult[],
    successes: Map<any, {
        name: string,
        time: number
    }[]>,
    pending: Set<Promise<TestResult>>,
    missingSuspects: Set<any>,
    callback?: (summary: TestSummary) => void
}



(function TK_DebugTestResults_init() {
    let timeStart = Date.now();
    let testResults = <(TestResult | Promise<TestResult>)[]>[];
    let testSuspects = <Set<any>>new Set();

    const publicExports = module.exports = <TK_DebugTest_file>{};



    const beautifyDifferences = function TK_DebugTestResults_beautifyDifferences(
        testResult: TestResult
    ) {
        const {errorMessage} = testResult;
        if (
            !(errorMessage instanceof Array)
            || errorMessage[0] !== "string"
            || errorMessage[0].slice(-13) !== "expectations:"
        ) {
            return testResult;
        }

        const differences = <EqualityDifference[]>errorMessage.slice(1);
        let path: string;
        const subMessages = differences.map(function (difference) {
            path = ["value", ...difference.path].join(".");
            if (difference.type === "different") {
                return [
                    path + " should have been:",difference.shouldBe,
                    "but instead is:",difference.value
                ];
            } else if (difference.type === "tooDeep") {
                return [
                    path + " is exceeding comparison depth"
                ];
            } else if (difference.type === "invalid") {
                return [
                    path + " did not pass test:",difference.shouldBe,
                    "with value:",difference.value
                ];
            } else if (difference.type === "unwanted") {
                return [
                    "unwanted property "+path + ":",difference.value
                ];
            }
            return difference;
        });
        // const difference = <EqualityDifference>message[length - 1];
        // let part = difference.onlyA;
        // if (Object.keys(part).length !== 0) { //extensive properties
        //     subMessages.push(["unwanted properties: ", part]);
        // }
        // part = difference.onlyB;
        // if (Object.keys(part).length !== 0) { //missing properties
        //     subMessages.push(["missing properties: ", part]);
        // }
        // Object.entries(difference.changed).forEach(function (keyAndValues) { //changed properties
        //     subMessages.push([
        //         "   property " + keyAndValues[0] + "is :",
        //         keyAndValues[1][0],
        //         "   and should have been:",
        //         keyAndValues[1][1]
        //     ]);
        // }, difference.changed);
        // return Object.assign({}, testResult, {
        //     errorMessage: [...message.slice(0, -2), "~ details ~", ...subMessages]
        // });
        return Object.assign({}, testResult, {
            errorMessage: [testResult.errorMessage[0], ...subMessages]
        });
    };

    publicExports.clearSummaryState = function TK_DebugTestResults_clearSummaryState(inputs = {}) {
        timeStart = Date.now();
        testResults = [];
        if (inputs.clearSuspects === true) {
            testSuspects = new Set();
        }
    };

    const getAllMethods = function TK_DebugTestResults_getAllMethods(data: any) {
        const result = <any[]>[];
        if (typeof data === "function") {
            result[0] = data;
        } else if (typeof data !== "object" || data === null) {
            return result;
        }

        Object.values(data).forEach(function (value) {
            result.push(...getAllMethods(value));
        });
        return result;
    };

    let pendingSummaries = <TestSummary[]>[];
    publicExports.getSummary = function TK_DebugTestResults_getSummary(callback) {
        const result = <TestSummary>{
            testCount: testResults.length,
            timeTotal: 0,
            successes: <Map<any, any[]>>new Map(),
            failures: [],
            pending: new Set(),
            missingSuspects: new Set(testSuspects),
            callback
        };
        testResults.forEach(
            summaryRegisterResult.bind(null, result));
        if (result.pending.size === 0) {
            getSummaryFinal(result);
        } else {
            pendingSummaries.push(result);
        }
        return result;
    };

    const getSummaryFinal = function TK_DebugTestResults_getSummaryFinal(
        summary: TestSummary
    ) {
        const pos = pendingSummaries.indexOf(summary);
        if (pos !== -1) {
            pendingSummaries.splice(pos, 1);
        }
        summary.timeTotal = Date.now() - timeStart;
        const { callback } = summary;
        if (typeof callback === "function") {
            delete summary.callback;
            callback(summary);
        }
    };

    const getSuspects = function TK_DebugTestResults_getSuspects(inputs: {
        suspect: any,
        mode: string
    }) {
        if (inputs.mode === "allMethods") {
            return getAllMethods(inputs.suspect);
        } else {
            return inputs.suspect
        };
    };

    publicExports.loadSummaryState = function TK_DebugTestResults_loadSummaryState(stateID) {
        ({ timeStart, testResults, testSuspects } = summaryHistory[stateID]);
    };

    const isSuspectConfig = function TK_DebugTestResults_issuspectConfig(inputs: any) {
        return typeof inputs === "object" && inputs.suspect !== undefined && typeof inputs.mode === "string";
    };

    const summaryHandlePromise = function TK_DebugTestResults_summaryHandlePromise(
        bound: {
            summary: TestSummary,
            promise: Promise<TestResult>
        },
        result: TestResult
    ) {
        const { summary } = bound;
        summary.pending.delete(bound.promise);
        summaryRegisterResult(summary, result);
        if (summary.pending.size === 0) {
            getSummaryFinal(summary);
        }
    };

    const summaryRegisterResult = function TK_DebugTest_summaryRegisterResults(
        summary: TestSummary,
        testResult: TestResult | Promise<TestResult>
    ) {
        if (testResult instanceof Promise) {
            summary.pending.add(testResult);
            const handleResolve = summaryHandlePromise.bind(null, {
                summary,
                promise: testResult
            });
            testResult.then(handleResolve);
            return;
        }

        summary.missingSuspects.delete(testResult.subject);
        if (testResult.errorMessage !== undefined) {
            summary.failures.push(
                beautifyDifferences(testResult)
            );
            return false;
        } else {
            summaryRegisterSuccess({
                list: summary.successes, testResult
            });
            return true;
        }
    };

    const summaryRegisterSuccess = function TK_DebugTest_summaryRegisterSuccess(inputs: {
        list: Map<any, {
            name: TestResult["name"], time: TestResult["time"]
        }[]>,
        testResult: TestResult
    }) {
        const { testResult } = inputs;
        const subjectDetails = inputs.list.get(testResult.subject);
        const data = {
            name: testResult.name,
            time: testResult.time
        };
        if (subjectDetails === undefined) {
            inputs.list.set(testResult.subject, [data]);
        } else {
            subjectDetails.push(data);
        }
    };

    publicExports.registerTestResult = function TK_DebugTestResults_registerTestResult(
        ...results
    ) {
        pendingSummaries.forEach(registerResultsDelayed.bind(null, results));
        testResults.push(...results);
    };

    const registerResultsDelayed = function TK_DebugTestResults_registerResultsDelayed(
        results: any[], summary: TestSummary
    ) {
        results.forEach(summaryRegisterResult.bind(null, summary));
    };

    publicExports.registerTestSuspect = function TK_DebugTestResults_registerTestSuspectLoop(...inputs) {
        if (inputs.length === 1 && isSuspectConfig(inputs[0])) {
            inputs = getSuspects(inputs[0]);
        }
        inputs.forEach(testSuspects.add.bind(testSuspects));
    };

    const summaryHistory = <Dictionary[]>[];
    publicExports.saveSummaryState = function TK_DebugTestResults_saveSummaryState() {
        const state = {
            timeStart,
            testResults: testResults.slice(0),
            testSuspects: new Set(testSuspects)
        };
        summaryHistory.push(state);
        return summaryHistory.length - 1;
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();