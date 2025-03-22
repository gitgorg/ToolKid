//general automated testing
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    getResultGroup(): {
        name: string,
        results: TestResultList
    }
    getResultGroup(name: string): {
        name: string,
        results: TestResultList
    } | undefined,
    switchResultGroup(
        name: string
    ): TestResultList,
    test(...configs: {
        subject: GenericFunction | string,
        execute(): any | Promise<any>
    }[]): (TestResult | Promise<TestResult>)[]
}

type TestResult = {
    subject: any,
    name: string,
    time: number,
    errorMessage?: any
}
type TestResultList = (TestResult | Promise<TestResult>)[]



(function TK_DebugTest_init() {
    type TestConfig = {
        subject: GenericFunction | string,
        execute(): void | Promise<void>
    }



    const publicExports = module.exports = <TK_DebugTest_file>{};

    const resultGroups: Map<string, TestResultList> = new Map([["default", []]]);
    let currentResultGroupName = "default";
    let currentResultGroup = <TestResultList>resultGroups.get("default");



    const createResultBase = function TK_DebugTest_createResultBase(
        config: TestConfig,
    ) {
        return <TestResult>{
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

        const testResults = <TestResultList>inputs.map(testSingle.bind(null, currentResultGroup));
        currentResultGroup.push(...testResults);
        // ToolKid.debug.test.registerTestResult(...testResults);
        return testResults;
    };

    const testSingle = function TK_DebugTest_testSingle(
        resultList: TestResultList, config: TestConfig
    ) {
        if (
            !isObjectWithExecute(config)
            || !isValidSubject(config.subject)
        ) {
            throw ["TK_DebugTest_test - invalid config:", config];
        }

        return testExecute({
            config,
            result: createResultBase(config),
            resultList
        });
    };

    const testExecute = function Test_testExecute(inputs: {
        config: TestConfig,
        result: TestResult,
        resultList: TestResultList
    }) {
        const { result } = inputs;
        const startTime = Date.now();
        try {
            const returned = inputs.config.execute();
            if (returned instanceof Promise) {
                const promise = testWatchPromise({
                    result,
                    startTime,
                    promise: returned,
                    resultList: inputs.resultList
                });
                promise.then(function Test_testExecute_handlePromise() {
                    const index = inputs.resultList.indexOf(promise);
                    inputs.resultList[index] = result;
                });
                return promise;
            }
        } catch (error) {
            result.errorMessage = error;
        }
        result.time = Date.now() - startTime;
        return Object.freeze(result);
    };

    const testWatchPromise = function TK_DebugTest_testWatchPromise(inputs: {
        result: TestResult,
        startTime: number,
        promise: Promise<any>,
        resultList: TestResultList
    }) {
        let resolver: any;
        const promise = <Promise<TestResult>>new Promise(function TK_DebugTest_testWatchPromiseCreate(resolve) {
            resolver = resolve;
        });
        const bound = {
            promise: inputs.promise,
            resolver,
            result: inputs.result,
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
        promise: Promise<TestResult>,
        result: TestResult,
        startTime: number,
        resolver: GenericFunction
    }) {
        bound.result.time = Date.now() - bound.startTime;
        bound.resolver(bound.result);
    };

    const testPromiseFailure = function TK_DebugTest_testPromiseFailure(
        bound: {
            result: TestResult,
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