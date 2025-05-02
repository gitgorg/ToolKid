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
    execute(
        scope: Dictionary
    ): any | Promise<any>,
    callback?(inputs: {
        scope: Dictionary,
        testResult: TKTestResult
    }): void
}
type TKTestResult = {
    subject: any,
    name: string,
    time: number,
    errorMessage?: any,
    errorSource?: string,
}
type TKTestResultGroup = {
    name: string,
    results: (TKTestResult | Promise<TKTestResult>)[],
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



    const createResultBase = function TK_DebugTest_createResultBase(
        config: TKTestConfig,
    ) {
        return <TKTestResult>{
            subject: config.subject,
            name: config.execute.name,
            time: 0
        };
    };

    const isObjectWithExecute = function TK_DebutTest_isObjectWithExecute(
        value: any
    ) {
        return typeof value === "object"
            && value !== null
            && typeof value.execute === "function";
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

        const results = resultGroups.get(name);
        return (results === undefined)
            ? undefined
            : { name, results }
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



    publicExports.test = function TK_DebugTest_testInterface(...inputs) {
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
        if (
            !isObjectWithExecute(config)
            || !isValidSubject(config.subject)
        ) {
            throw ["TK_DebugTest_test - invalid config:", config];
        }

        return testExecute({
            config,
            testResult: createResultBase(config),
            resultGroup
        });
    };

    // TODO: unit tests for callback function

    const testExecute = function Test_testExecute(inputs: {
        config: TKTestConfig,
        testResult: TKTestResult,
        resultGroup: TKTestResultGroup
    }) {
        const { testResult } = inputs;
        const startTime = Date.now();
        const scope = {};
        try {
            const returned = inputs.config.execute(scope);
            if (returned instanceof Promise) {
                const promise = testWatchPromise({
                    testResult,
                    startTime,
                    promise: returned,
                    resultGroup: inputs.resultGroup,
                    source: ToolKid.debug.callstack.readFrames({ position: 6 })[0],
                });
                promise.then(function Test_testExecute_handlePromise() {
                    if (typeof inputs.config.callback === "function") {
                        inputs.config.callback({ scope, testResult });
                    }
                    const { results } = inputs.resultGroup;
                    const index = results.indexOf(promise);
                    results[index] = testResult;
                });
                return promise;
            }

            testResult.time = Date.now() - startTime;
        } catch (error) {
            testResult.time = Date.now() - startTime;
            testResult.errorMessage = error;
            testResult.errorSource = ToolKid.debug.callstack.readFrames({ position: 6 })[0];
            if (inputs.resultGroup.failureHandler !== undefined) {
                inputs.resultGroup.failureHandler(testResult);
            }
        }
        if (typeof inputs.config.callback === "function") {
            inputs.config.callback({ scope, testResult });
        }
        return Object.freeze(testResult);
    };

    const testWatchPromise = function TK_DebugTest_testWatchPromise(inputs: {
        testResult: TKTestResult,
        startTime: number,
        promise: Promise<any>,
        resultGroup: TKTestResultGroup,
        source: string,
    }) {
        let resolver: any;
        const promise = <Promise<TKTestResult>>new Promise(function TK_DebugTest_testWatchPromiseCreate(resolve) {
            resolver = resolve;
        });
        (<Dictionary>inputs).resolver = resolver;
        inputs.promise.then(
            testPromiseSuccess.bind(null, inputs),
            testPromiseFailure.bind(null, inputs)
        );
        return promise;
    };

    const testPromiseSuccess = function TK_DebugTest_testPromiseSuccess(bound: {
        promise: Promise<TKTestResult>,
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
        testResult.errorMessage = reason;
        testResult.time = Date.now() - bound.startTime;
        if (reason === undefined) {
            reason = "Unspecified Error"
        }
        testResult.errorMessage = reason;
        testResult.errorSource = bound.source;
        if (bound.resultGroup.failureHandler !== undefined) {
            bound.resultGroup.failureHandler(testResult);
        }
        bound.resolver(Object.freeze(testResult));
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();