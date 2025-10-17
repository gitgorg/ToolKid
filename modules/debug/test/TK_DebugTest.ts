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
    callback?(inputs: {
        scope: Dictionary,
        testResult: TKTestResult
    }): void
} & ({
    execute(
        scope: Dictionary
    ): (any | Promise<any>),
    assert?: Parameters<TK_DebugTest_file["assert"]>[0],
} | {
    execute?: (
        scope: Dictionary
    ) => (any | Promise<any>),
    assert: Parameters<TK_DebugTest_file["assert"]>[0],
})
type TKTestResult = {
    subject: any,
    name: string,
    time: number,
    errorMessage?: any,
    errorSource?: string,
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



    const executeAssert = function assert(inputs: Dictionary) {
        ToolKid.debug.test.assert(inputs);
    };
    const createResultBase = function TK_DebugTest_createResultBase(
        config: TKTestConfig & { assert: any, execute: any },
    ) {
        return <TKTestResult>{
            subject: config.subject,
            name: typeof config.execute === "function"
                ? config.execute.name
                : "assert",
            time: 0
        };
    };

    const fillErrorResult = function TK_DebugTest_fillErrorResult(
        testResult: TKTestResult,
        error: any,
        failureHandler?: { (result: TKTestResult): void }
    ) {
        testResult.time = 0;
        testResult.errorMessage = error || "Unspecified Error";
        testResult.errorSource = testResult.errorSource || ToolKid.debug.callstack.readFrames({ position: 7 })[0];
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
        const testResult = createResultBase(<any>config);
        if (typeof config !== "object" || config === null) {
            return testFinish(fillErrorResult(testResult,
                ["TK_DebugTest_test - config has to be an object but is:", config],
                resultGroup.failureHandler
            ), config, {});
        } else if (!isValidSubject(config.subject)) {
            return testFinish(fillErrorResult(testResult,
                ["TK_DebugTest_test - config.subject has to be a named function or a string but is:", config.subject],
                resultGroup.failureHandler
            ), config, {});
        }

        return testExecute({
            config,
            testResult,
            resultGroup
        });
    };

    // TODO: unit tests for callback function

    const testExecute = function Test_testExecute(inputs: {
        config: TKTestConfig,
        testResult: TKTestResult,
        resultGroup: TKTestResultGroup
    }) {
        const { config, testResult } = inputs;
        const startTime = Date.now();
        const scope = {};
        if (typeof config.execute === "function") {
            try {
                const executionPromise = (<Dictionary>config).execute(scope);
                if (executionPromise instanceof Promise) {
                    const resultPromiseInputs = {
                        testResult,
                        startTime,
                        promise: executionPromise,
                        resultGroup: inputs.resultGroup,
                        source: ToolKid.debug.callstack.readFrames({ position: 6 })[0],
                    };
                    const resultPromise = <TKTestResultPromise>new Promise(function TK_DebugTest_testWatchPromiseCreate(resolve, reject) {
                        (<Dictionary>resultPromiseInputs).resolver = resolve;
                    });
                    resultPromise.subject = config.subject;
                    resultPromise.execution = config.execute;
                    executionPromise.then(
                        testPromiseSuccess.bind(null, resultPromiseInputs),
                        testPromiseFailure.bind(null, resultPromiseInputs)
                    );
                    resultPromise.then(function Test_testExecute_handlePromise() {
                        const { results } = inputs.resultGroup;
                        const index = results.indexOf(resultPromise);
                        testResult.time = Date.now() - startTime;
                        results[index] = testFinish(testResult, config, scope);
                    });
                    return resultPromise;
                }
            } catch (error) {
                fillErrorResult(
                    testResult, error,
                    inputs.resultGroup.failureHandler
                );
            }
        } else if (config.assert === undefined) {
            throw ["TK_DebugTest_test - no valid .execute or .assert defined", config];
        }

        testResult.time = Date.now() - startTime;
        return testFinish(testResult, config, scope);
    };

    const testFinish = function (
        testResult: TKTestResult,
        config: TKTestConfig,
        scope: Dictionary,
    ) {
        if (config.assert !== undefined) {
            executeAssert(config.assert);
        }
        if (typeof config.callback === "function") {
            config.callback({ scope, testResult });
        }
        return Object.freeze(testResult);
    };

    const testPromiseSuccess = function TK_DebugTest_testPromiseSuccess(bound: {
        promise: TKTestResultPromise,
        testResult: TKTestResult,
        startTime: number,
        resolver: GenericFunction
    }) {
        bound.testResult.time = Date.now() - bound.startTime;
        bound.resolver(bound.testResult);
    };

    const testPromiseFailure = function TK_DebugTest_testPromiseFailure(
        bound: {
            testResult: TKTestResult,
            startTime: number,
            resolver: GenericFunction,
            resultGroup: TKTestResultGroup,
            source: string,
        }, reason: any
    ) {
        const { testResult } = bound;
        testResult.errorSource = bound.source;
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