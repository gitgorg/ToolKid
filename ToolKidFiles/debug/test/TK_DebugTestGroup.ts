//collecting automated test results
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    createTestGroup(): TestGroup
}

type TestGroup = {
    getResults(
        callback?: {(
            summary: TestGroupResults
        ): void}
    ): TestGroupResults,
    registerResults(
        ...results: (TestResult | Promise<TestResult>)[]
    ): void,
    registerSuspects(
        ...inputs: any[]
    ): void
    registerSuspects(inputs: {
        suspect: any | any[],
        mode: "allMethods"
    }): void
}

type TestGroupResults = {
    failures: TestResult[],
    pendingResults: Promise<TestResult>[],
    successes: TestResult[],
    suspects: any[],
    timeTotal: number
}


(function TK_DebugTestFull_init() {
    type PrivateData = {
        callbacks:{(
            summary:TestGroupResults
        ):void}[],
        failures: TestResult[],
        pendingResults: Set<Promise<TestResult>>,
        successes: TestResult[],
        suspects: Set<any>,
        timeStart: number
    }



    const publicExports = module.exports = <TK_DebugTest_file>{};

    const TestGroup = <any>function TestGroup() { };

    publicExports.createTestGroup = function TK_debugTestGroup_createInstance() {
        const privateData: PrivateData = {
            callbacks: [],
            failures: [],
            pendingResults: new Set(),
            successes: [],
            suspects: new Set(),
            timeStart: Date.now()
        };
        const result = <TestGroup>new TestGroup();
        result.getResults = getResults.bind(null, privateData);
        result.registerResults = registerResults.bind(null, privateData);
        result.registerSuspects = registerSuspects.bind(null, privateData);
        return result;
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

    const getResults = function TK_DebugTestResults_getResults(
        privateData: PrivateData, callback?: GenericFunction
    ) {
        const results: TestGroupResults = {
            failures: privateData.failures.slice(0),
            pendingResults: Array.from(privateData.pendingResults),
            successes: privateData.successes.slice(0),
            suspects: Array.from(privateData.suspects),
            timeTotal: Date.now() - privateData.timeStart
        };
        if (typeof callback === "function") {
            privateData.callbacks.push(callback);
        }
        if (privateData.pendingResults.size === 0) {
            privateData.callbacks.forEach(function(cb){
                cb(results);
            });
            privateData.callbacks = [];
        }
        return results;
    };

    const handlePromise = function TK_DebugTestResults_summaryHandlePromise(
        bound: {
            privateData: PrivateData,
            promise: Promise<TestResult>
        },
        result: TestResult
    ) {
        placeResult(bound.privateData, result);
        const { pendingResults } = bound.privateData;
        pendingResults.delete(bound.promise);
        if (pendingResults.size === 0) {
            getResults(bound.privateData);
        }
    };

    const placeResult = function (
        privateData:PrivateData, result:TestResult
    ) {
        if (result.errorMessage === undefined) {
            privateData.successes.push(result)
        } else {
            privateData.failures.push(result);
        }
    };

    const registerResults = function TK_DebugTestGroup_registerResultsLoop(
        privateData: PrivateData,
        ...results: (TestResult | Promise<TestResult>)[]
    ) {
        const length = results.length;
        let result:TestResult|Promise<TestResult>;
        for (let i=0; i<length; i+=1) {
            result = results[i];
            if (!(result instanceof Promise)) {
                placeResult(privateData, result);
                continue;
            }

            privateData.pendingResults.add(result);
            result.then(handlePromise.bind(null, {
                privateData,
                promise: result
            }));
        };
    };

    const registerSuspects = function TK_DebugTestResults_regiserSuspectsLoop(
        privateData: PrivateData, ...suspects: any[]
    ) {
        const config = suspects[0];
        if (
            suspects.length === 1
            && typeof config === "object"
            && config.suspect !== undefined
        ) {
            if (config.mode === "allMethods") {
                suspects = getAllMethods(config.suspect);
            }
        }
        suspects.forEach(privateData.suspects.add.bind(privateData.suspects));
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();