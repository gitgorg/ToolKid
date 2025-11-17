//collecting automated test results
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    getSummary(inputs?: {
        name?: string,
        suspects?: any[],
        callback?(
            summary: TestSummary
        ): void
    }): TestSummary
}

type TestSummary = {
    name: string,
    testCount: number,
    failures: TKTestResult[],
    successes: Map<any, {
        name: string,
        time: number
    }[]>,
    pending: Set<Promise<TKTestResult>>,
    missingSuspects: Set<any>,
    testedSuspects: Set<any>,
    callback?: (summary: TestSummary) => void
}



(function TK_DebugTestSummary_init() {
    const publicExports = module.exports = <TK_DebugTest_file>{};

    const beautifyDifferences = function TK_DebugTestSummary_beautifyDifferences(
        testResult: TKTestResult
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

    const getAllMethods = function TK_DebugTestSummary_getAllMethods(suspect: any) {
        const result = <any[]>[];
        if (typeof suspect === "function") {
            result[0] = suspect;
        } else if (typeof suspect !== "object" || suspect === null) {
            return result;
        }

        Object.values(suspect).forEach(function (value) {
            result.push(...getAllMethods(value));
        });
        return result;
    };

    const registerSuspect = function TK_DebugTestSummary_registerSuspect(
        suspectList: Set<any>, suspect: any
    ) {
        const methods = getAllMethods(suspect);
        if (methods.length === 0) {
            suspectList.add(suspect);
        } else {
            methods.forEach(suspectList.add.bind(suspectList));
        }
    };

    let pendingSummaries = <TestSummary[]>[];
    publicExports.getSummary = function TK_DebugTestSummary_getSummary(
        inputs = {}
    ) {
        const { suspects, callback } = inputs;
        let missingSuspects = new Set();
        if (suspects !== undefined) {
            suspects.forEach(registerSuspect.bind(null, missingSuspects));
        }
        const resultGroup = <TKTestResultGroup>ToolKid.debug.test.getResultGroup(<string>inputs.name);
        const summary = createSummary(Object.assign({},
            resultGroup,
            { missingSuspects }
        ));
        if (typeof callback !== "function") {
            return summary;
        }

        if (summary.pending.size === 0) {
            callback(summary);
            return summary;
        }

        const boundData = {
            name: resultGroup.name,
            inputs,
            pendingCount: summary.pending.size
        };
        summary.pending.forEach(function TK_DebugTestSummary_watchPromise(
            promise
        ) {
            promise.then(summaryCallbackCheck.bind(null, boundData));
        });
        return summary;
    };

    const summaryCallbackCheck = function TK_DebugTestSummary_summaryCallbackCheck(
        boundData: Dictionary
    ) {
        boundData.pendingCount -= 1;
        if (boundData.pendingCount === 0 && boundData.pendingCallback === undefined) {
            boundData.pendingCallback = true;
            setTimeout(summaryCallback.bind(null, boundData), 0);
        }
    };

    const summaryCallback = function TK_DebugTestSummary_summaryCallback(
        boundData: Dictionary
    ) {
        delete boundData.pendingCallback;
        if (boundData.pendingCount === 0) {
            publicExports.getSummary(Object.assign({},boundData.inputs,{
                name: boundData.name
            }));
        }
    };

    const createSummary = function (inputs: TKTestResultGroup & {
        missingSuspects: Set<any>
    }) {
        const resultGroupName = inputs.name;
        const summary: TestSummary = {
            name: resultGroupName,
            testCount: 0,
            failures: [],
            successes: new Map(),
            pending: new Set(),
            missingSuspects: inputs.missingSuspects,
            testedSuspects: new Set()
        };
        inputs.results.forEach(
            summaryRegisterResult.bind(null, summary)
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
        const { callback } = summary;
        if (typeof callback === "function") {
            delete summary.callback;
            callback(summary);
        }
    };

    const summaryHandlePromise = function TK_DebugTestSummary_summaryHandlePromise(
        bound: {
            summary: TestSummary,
            promise: Promise<TKTestResult>
        },
        result: TKTestResult
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
        testResult: TKTestResult | Promise<TKTestResult>
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

        removeSuspect(summary, testResult.subject);
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

    // TODO: find the duplicate for TK_nodeJS_writeFile and remove this
    const removeSuspect = function TK_DebugTestSummary_removeSuspect(
        summary: TestSummary, subject: any
    ) {
        if (summary.testedSuspects.has(subject)) {
            return;
        }

        summary.testedSuspects.add(subject);
        const { missingSuspects } = summary;
        if (
            missingSuspects.delete(subject) === false
            && typeof subject === "function"
        ) {
            const { name } = subject;
            missingSuspects.forEach(function TK_DebugTestSummary_removeSuspectFind(suspect) {
                if (
                    typeof suspect === "function"
                    && suspect.name === name
                    && suspect.toString() === subject.toString()
                ) {
                    summary.missingSuspects.delete(suspect);
                }
            })
        }
    };

    const summaryRegisterSuccess = function TK_DebugTest_summaryRegisterSuccess(inputs: {
        list: Map<any, {
            name: TKTestResult["name"], time: TKTestResult["time"]
        }[]>,
        testResult: TKTestResult
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

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "test", entries: publicExports });
    }
})();