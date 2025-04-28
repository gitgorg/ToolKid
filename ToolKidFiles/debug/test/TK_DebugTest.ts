//general automated testing
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    getResultGroup(): {
        name: string,
        results: TKTestResultList
    }
    getResultGroup(name: string): {
        name: string,
        results: TKTestResultList
    } | undefined,
    switchResultGroup(
        name: string
    ): TKTestResultList,
    test(
        ...configs: TKTestConfig[]
    ): TKTestResultList
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
    errorMessage?: any
}
type TKTestResultList = (TKTestResult | Promise<TKTestResult>)[]



(function TK_DebugTest_init() {
    const publicExports = module.exports = <TK_DebugTest_file>{};

    const resultGroups: Map<string, TKTestResultList> = new Map([["default", []]]);
    let currentResultGroupName = "default";
    let currentResultGroup = <TKTestResultList>resultGroups.get("default");



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
                name: currentResultGroupName,
                results: currentResultGroup
            };
        }

        const results = resultGroups.get(name);
        return (results === undefined)
            ? undefined
            : { name, results }
    };

    publicExports.switchResultGroup = function TK_DebugTest_selectTestGroup(name) {
        if (typeof name !== "string" || name.length === 0) {
            throw ["TK_DebugTest_selectTestGroup - invalid name:", name]
        }

        const found = resultGroups.get(name);
        if (found === undefined) {
            currentResultGroup = [];
            resultGroups.set(name, currentResultGroup);
        } else {
            currentResultGroup = found;
        }
        currentResultGroupName = name;
        return currentResultGroup;
    };

    publicExports.test = function TK_DebugTest_testInterface(...inputs) {
        if (inputs.length === 0) {
            throw ["TK_DebugTest_test - no config received"];
        }

        const testResults = <TKTestResultList>inputs.map(testSingle.bind(null, currentResultGroup));
        currentResultGroup.push(...testResults);
        return testResults;
    };

    const testSingle = function TK_DebugTest_testSingle(
        resultList: TKTestResultList,
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
            resultList
        });
    };

    // TODO: unit tests for callback function

    const testExecute = function Test_testExecute(inputs: {
        config: TKTestConfig,
        testResult: TKTestResult,
        resultList: TKTestResultList
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
                    resultList: inputs.resultList
                });
                promise.then(function Test_testExecute_handlePromise() {
                    if (typeof inputs.config.callback === "function") {
                        inputs.config.callback({ scope, testResult });
                    }
                    const index = inputs.resultList.indexOf(promise);
                    inputs.resultList[index] = testResult;
                });
                return promise;
            }

        } catch (error) {
            testResult.errorMessage = error;
        }
        testResult.time = Date.now() - startTime;
        if (typeof inputs.config.callback === "function") {
            inputs.config.callback({ scope, testResult });
        }
        return Object.freeze(testResult);
    };

    const testWatchPromise = function TK_DebugTest_testWatchPromise(inputs: {
        testResult: TKTestResult,
        startTime: number,
        promise: Promise<any>,
        resultList: TKTestResultList
    }) {
        let resolver: any;
        const promise = <Promise<TKTestResult>>new Promise(function TK_DebugTest_testWatchPromiseCreate(resolve) {
            resolver = resolve;
        });
        const bound = {
            promise: inputs.promise,
            resolver,
            result: inputs.testResult,
            startTime: inputs.startTime,
            resultList: inputs.resultList
        };
        inputs.promise.then(
            testPromiseSuccess.bind(null, bound),
            testPromiseFailure.bind(null, bound)
        );
        return promise;
    };

    const testPromiseSuccess = function TK_DebugTest_testPromiseSuccess(bound: {
        promise: Promise<TKTestResult>,
        result: TKTestResult,
        startTime: number,
        resolver: GenericFunction
    }) {
        bound.result.time = Date.now() - bound.startTime;
        bound.resolver(bound.result);
    };

    const testPromiseFailure = function TK_DebugTest_testPromiseFailure(
        bound: {
            result: TKTestResult,
            startTime: number,
            resolver: GenericFunction
        }, reason: any
    ) {
        const { result } = bound;
        result.errorMessage = reason;
        result.time = Date.now() - bound.startTime;
        if (reason === undefined) {
            reason = "Unspecified Error"
        }
        result.errorMessage = reason;
        bound.resolver(Object.freeze(result));
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();