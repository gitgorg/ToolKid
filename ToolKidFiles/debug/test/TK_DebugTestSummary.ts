//collecting automated test results
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    registerTestSuspect(
        ...inputs: any[]
    ): void,
    registerTestSuspect(inputs: {
        suspect: any | any[],
        mode: "allMethods"
    }): void,

    getSummary(
        callback?: (summary: TestSummary) => void
    ): TestSummary
}

type TestSummary = {
    name: string,
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



(function TK_DebugTestSummary_init() {
    let timeStart = Date.now();

    const publicExports = module.exports = <TK_DebugTest_file>{};


    const beautifyDifferences = function TK_DebugTestSummary_beautifyDifferences(
        testResult: TestResult
    ) {
        const { errorMessage } = testResult;
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
                    path + " should have been:", difference.shouldBe,
                    "but instead is:", difference.value
                ];
            } else if (difference.type === "tooDeep") {
                return [
                    path + " is exceeding comparison depth"
                ];
            } else if (difference.type === "invalid") {
                return [
                    path + " did not pass test:", difference.shouldBe,
                    "with value:", difference.value
                ];
            } else if (difference.type === "unwanted") {
                return [
                    "unwanted property " + path + ":", difference.value
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

    const getAllMethods = function TK_DebugTestSummary_getAllMethods(data: any) {
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
    publicExports.getSummary = function TK_DebugTestSummary_getSummary(callback) {
        const resultGroup = ToolKid.debug.test.getResultGroup();
        const summary = createSummary(resultGroup);
        if (typeof callback !== "function") {
            return summary;
        }

        if (summary.pending.size === 0) {
            callback(summary);
            return summary;
        }

        const boundData = {
            pendingCount: summary.pending.size,
            callback
        };
        summary.pending.forEach(function TK_DebugTestSummary_watchPromise(
            promise
        ) {
            promise.then(summaryCallback.bind(null,boundData));
        });
        return summary;
    };

    const summaryCallback = function TK_DebugTestSummary_summaryCallback(
        boundData:Dictionary
    ) {
        boundData.pendingCount -= 1;
        if (boundData.pendingCount === 0) {
            publicExports.getSummary(boundData.callback);
        }
    }

    const createSummary = function (resultGroup: {
        name: string,
        results: TestResultList
    }) {
        const resultGroupName = resultGroup.name;
        const summary: TestSummary = {
            name: resultGroupName,
            testCount: 0,
            timeTotal: 100, //results.timeTotal,
            failures: [],
            successes: new Map(),
            pending: new Set(),
            missingSuspects: suspects.get(resultGroupName) || new Set()
        };
        resultGroup.results.forEach(
            summaryRegisterResult.bind(null,summary)
        );
        return summary;
    };

    const getSummaryFinal = function TK_DebugTestSummary_getSummaryFinal(
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

    const getSuspects = function TK_DebugTestSummary_getSuspects(inputs: {
        suspect: any,
        mode: string
    }) {
        if (inputs.mode === "allMethods") {
            return getAllMethods(inputs.suspect);
        } else {
            return inputs.suspect
        };
    };

    const isSuspectConfig = function TK_DebugTestSummary_issuspectConfig(inputs: any) {
        return typeof inputs === "object" && inputs.suspect !== undefined && typeof inputs.mode === "string";
    };

    const summaryHandlePromise = function TK_DebugTestSummary_summaryHandlePromise(
        bound: {
            summary: TestSummary,
            promise: Promise<TestResult>
        },
        result: TestResult
    ) {
        const { summary } = bound;
        summary.pending.delete(bound.promise);
        summary.testCount -= 1;
        summaryRegisterResult(summary, result);
        if (summary.pending.size === 0) {
            getSummaryFinal(summary);
        }
    };

    const summaryRegisterResult = function TK_DebugTest_summaryRegisterResult(
        summary: TestSummary,
        testResult: TestResult | Promise<TestResult>
    ) {
        summary.testCount += 1;
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
        if (testResult.errorMessage === undefined) {
            summaryRegisterSuccess({
                list: summary.successes, testResult
            });
        } else {
            summary.failures.push(
                beautifyDifferences(testResult)
            );
        }
    };

    const summaryRegisterSuccess = function TK_DebugTest_summaryRegisterSuccess(inputs: {
        list: Map<any, {
            name: TestResult["name"], time: TestResult["time"]
        }[]>,
        testResult: TestResult
    }) {
        const { testResult } = inputs;
        const data = {
            name: testResult.name,
            time: testResult.time
        };
        const subjectDetails = inputs.list.get(testResult.subject);
        if (subjectDetails === undefined) {
            inputs.list.set(testResult.subject, [data]);
        } else {
            subjectDetails.push(data);
        }
    };

    const suspects = new Map();
    publicExports.registerTestSuspect = function TK_DebugTestSummary_registerTestSuspect(...inputs) {
        const testeGroupName = ToolKid.debug.test.getResultGroup().name;
        let currentSuspects = suspects.get(testeGroupName);
        if (currentSuspects === undefined) {
            currentSuspects = new Set();
            suspects.set(testeGroupName, currentSuspects);
        }
        if (inputs.length === 1 && isSuspectConfig(inputs[0])) {
            inputs = getSuspects(inputs[0]);
        }
        inputs.forEach(currentSuspects.add.bind(currentSuspects));
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();