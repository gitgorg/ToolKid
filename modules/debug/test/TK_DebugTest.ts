//general automated testing
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    getResultGroup(): TKTestResultGroup
    getResultGroup(
        name: string
    ): TKTestResultGroup | undefined,
    switchResultGroup(
        name: string
    ): TKTestResultGroup["results"],

    test(
        ...configs: TKTestConfig[]
    ): TKTestResultGroup["results"],
    setFailureHandler(
        callback: TKTestResultGroup["failureHandler"]
    ): void,
}

type TKTestConfig = {
    subject: GenericFunction | string,
    origin?: string,
    callback?(inputs: {
        scope: Dictionary,
        testResult: TKTestResult
    }): void
} & ({
    execute(
        scope: Dictionary
    ): (any | Promise<any>),
    assert?: { (): Parameters<TK_DebugTest_file["assert"]>[0] },
} | {
    execute?: (
        scope: Dictionary
    ) => (any | Promise<any>),
    assert: { (): Parameters<TK_DebugTest_file["assert"]>[0] },
})
type TKTestResult = {
    subject: any,
    name: string,
    time: number,
    errorMessage?: any,
    origin?: string,
}
type TKTestResultPromise = Promise<TKTestResult> & {
    subject: TKTestConfig['subject'],
    execution: TKTestConfig['execute'],
}
type TKTestResultGroup = {
    name: string,
    results: (TKTestResult | TKTestResultPromise)[],
    failureHandler?(
        result: TKTestResult
    ): void
}



(function TK_DebugTest_init() {
    const publicExports = module.exports = <TK_DebugTest_file>{};

    const resultGroups = new Map([["default", <TKTestResultGroup>{
        name: "default",
        results: []
    }]]);
    let currentResultGroup = <TKTestResultGroup>resultGroups.get("default");



    const fillErrorResult = function TK_DebugTest_fillErrorResult(
        testResult: TKTestResult,
        error: any,
        failureHandler?: { (result: TKTestResult): void },
        callstackPosition = 7
    ) {
        testResult.errorMessage = error || "Unspecified Error";
        testResult.origin = (typeof testResult.origin === "string")
            ? ToolKid.debug.callstack.extractFileName(testResult.origin)
            : ToolKid.debug.callstack.readFrames({ position: callstackPosition })[0];
        if (failureHandler !== undefined) {
            failureHandler(testResult);
        }
        return testResult;
    };

    const isValidSubject = function TK_DebugTest_isValidSubject(
        subject: any
    ) {
        if (typeof subject === "function") {
            return subject.name.length !== 0;
        } else {
            return typeof subject === "string" && subject.length !== 0;
        }
    };

    publicExports.getResultGroup = <any>function TK_DebugTest_getResultGroup(
        name: string
    ) {
        if (typeof name !== "string") {
            return {
                name: currentResultGroup.name,
                results: currentResultGroup.results
            };
        }

        const group = resultGroups.get(name);
        return (group === undefined)
            ? undefined
            : { name, results: group.results }
    };

    publicExports.setFailureHandler = function TK_DebugTest_setFailureHandler(handler) {
        currentResultGroup.failureHandler = handler;
    };

    publicExports.switchResultGroup = function TK_DebugTest_selectTestGroup(name) {
        if (typeof name !== "string" || name.length === 0) {
            throw ["TK_DebugTest_selectTestGroup - invalid name:", name]
        }

        const found = resultGroups.get(name);
        if (found === undefined) {
            currentResultGroup = <TKTestResultGroup>{
                name,
                results: [],
            };
            resultGroups.set(name, currentResultGroup);
        } else {
            currentResultGroup = found;
        }
        return currentResultGroup.results;
    };



    publicExports.test = function TK_DebugTest_test(...inputs) {
        if (inputs.length === 0) {
            throw ["TK_DebugTest_test - no config received"];
        }

        const testResults = <TKTestResultGroup["results"]>inputs.map(testSingle.bind(null, currentResultGroup));
        currentResultGroup.results.push(...testResults);
        return testResults;
    };

    const testSingle = function TK_DebugTest_testSingle(
        resultGroup: TKTestResultGroup,
        config: TKTestConfig,
    ) {
        const testResult = <TKTestResult>{
            subject: config.subject,
            origin: config.origin,
            name: typeof config.execute === "function"
                ? config.execute.name
                : "assert",
            time: Date.now(),
        };
        if (typeof config !== "object" || config === null) {
            return testFinish(config, fillErrorResult(testResult,
                ["TK_DebugTest_test - config has to be an object but is:", config],
                resultGroup.failureHandler
            ), resultGroup, {});
        } else if (!isValidSubject(config.subject)) {
            return testFinish(config, fillErrorResult(testResult,
                ["TK_DebugTest_test - config.subject has to be a named function or a string but is:", config.subject],
                resultGroup.failureHandler
            ), resultGroup, {});
        }

        return testExecute(config, testResult, resultGroup);
    };

    // TODO: unit tests for callback function

    const testExecute = function Test_testExecute(
        config: TKTestConfig,
        testResult: TKTestResult,
        resultGroup: TKTestResultGroup
    ) {
        if (typeof config.execute !== "function") {
            if (config.assert === undefined) {
                throw ["TK_DebugTest_test - no valid .execute or .assert defined", config];
            } else {
                return testFinish(config, testResult, resultGroup, {});
            }
        }

        const scope = {};
        try {
            const promise = (<Dictionary>config).execute(scope);
            if (promise instanceof Promise) {
                return createPromisedResult(
                    config, testResult, resultGroup,
                    scope, <any>promise, testPromiseSuccess
                );
            }

        } catch (error) {
            fillErrorResult(
                testResult, error,
                resultGroup.failureHandler
            );
        }
        return testFinish(config, testResult, resultGroup, scope);
    };

    const createPromisedResult = function (
        config: TKTestConfig,
        testResult: TKTestResult,
        resultGroup: TKTestResultGroup,
        scope: Dictionary,
        promise: TKTestResultPromise,
        resolver: GenericFunction,
    ) {
        testResult.origin = ToolKid.debug.callstack.readFrames({ position: 7 })[0];
        const promiseInternals = <Dictionary>{
            testResult,
            promise,
            resultGroup,
        };
        const resultPromise = promiseInternals.resultPromise = <TKTestResultPromise>new Promise(function TK_DebugTest_testWatchPromiseCreate(resolve, reject) {
            promiseInternals.resolver = resolve;
        });
        resultPromise.subject = config.subject;
        resultPromise.execution = config.execute;
        promise.then(
            resolver.bind(null, promiseInternals),
            testPromiseFailure.bind(null, <any>promiseInternals)
        );
        resultPromise.then(function Test_testExecute_handlePromise() {
            const { results } = resultGroup;
            const index = results.indexOf(resultPromise);
            results[index] = testFinish(config, testResult, resultGroup, scope);
        });
        scope.promise = promiseInternals;
        return resultPromise;
    };

    const testFinish = function TK_DebugTest_testFinish(
        config: TKTestConfig,
        testResult: TKTestResult,
        resultGroup: TKTestResultGroup,
        scope: Dictionary,
        originDepth = 8,
    ) {
        if (config.assert === undefined || testResult.errorMessage !== undefined) {
            return testCallback(config, testResult, scope);
        } else if (typeof config.assert !== "function") {
            fillErrorResult(testResult,
                ["TK_DebugTest_testAssert - the testConfig.assert property has to be a function which returns the inputs for the test.assert function:", config],
                resultGroup.failureHandler, originDepth
            );
            return testCallback(config, testResult, scope);
        }

        try {
            const inputs = config.assert();
            try {
                const promise = ToolKid.debug.test.assert(inputs);
                if (promise !== undefined) {
                    testResult.origin = ToolKid.debug.callstack.readFrames({ position: 7 })[0];
                    (<Promise<any>>promise).catch(
                        testHandlePromiseRejection.bind(null, testResult, resultGroup)
                    ).finally(
                        testCallback.bind(null, config, testResult, scope)
                    );
                    //TODO: return promise instead
                    return testResult;
                }

            } catch (error) {
                fillErrorResult(
                    testResult, error,
                    resultGroup.failureHandler, originDepth
                );
            }
        } catch (error) {
            fillErrorResult(
                testResult, ["TK_DebugTest_testAssert - evaluating assert inputs failed:", error],
                resultGroup.failureHandler, originDepth
            );
        }
        return testCallback(config, testResult, scope);
    };

    const testHandlePromiseRejection = function TK_DebutTest_testHandlePromiseRejection(
        testResult: TKTestResult,
        resultGroup: TKTestResultGroup,
        reason: any
    ) {
        fillErrorResult(
            testResult, reason,
            resultGroup.failureHandler
        );
    };

    const testCallback = function TK_DebugTest_testCallback(
        config: TKTestConfig,
        testResult: TKTestResult,
        scope: Dictionary,
    ) {
        testResult.time = Date.now() - testResult.time;
        if (typeof config.callback === "function") {
            config.callback({ scope, testResult });
        }
        return Object.freeze(testResult);
    };

    const testPromiseSuccess = function TK_DebugTest_testPromiseSuccess(bound: {
        testResult: TKTestResult,
        resolver: GenericFunction
    }) {
        bound.resolver(bound.testResult);
    };

    const testPromiseFailure = function TK_DebugTest_testPromiseFailure(
        bound: {
            testResult: TKTestResult,
            resolver: GenericFunction,
            resultGroup: TKTestResultGroup,
        }, reason: any
    ) {
        const { testResult } = bound;
        fillErrorResult(
            testResult, reason,
            bound.resultGroup.failureHandler
        );
        bound.resolver(testResult);
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "test", entries: publicExports });
    }
})();