//general automated testing
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
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



(function TK_DebugTest_init() {
    type TestConfig = {
        subject: GenericFunction | string,
        execute(): void | Promise<void>
    }



    const publicExports = module.exports = <TK_DebugTest_file>{};



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

    publicExports.test = function TK_DebugTest_testInterface(...inputs) {
        if (inputs.length === 0) {
            throw ["TK_DebugTest_test - no config received"];
        }

        const testResults = inputs.map(testSingle);
        ToolKid.debug.test.registerTestResult(...testResults);
        return testResults;
    };

    const testSingle = function TK_DebugTest_testSingle(
        config: TestConfig
    ) {
        if (
            !isObjectWithExecute(config)
            || !isValidSubject(config.subject)
        ) {
            throw ["TK_DebugTest_test - invalid config:", config];
        }

        const testResult = createResultBase(config);
        return testExecute({ config, result:testResult });
    };

    const testExecute = function Test_testExecute(inputs: {
        config: TestConfig,
        result: TestResult
    }) {
        const { result } = inputs;
        const startTime = Date.now();
        try {
            const returned = inputs.config.execute();
            if (returned instanceof Promise) {
                return testWatchPromise({
                    result, startTime, promise: returned
                });
            }

        } catch (error) {
            result.errorMessage = error;
        }
        result.time = Date.now() - startTime;
        return result;
    };

    const testWatchPromise = function TK_DebugTest_testWatchPromise(inputs: {
        result: TestResult,
        startTime: number,
        promise: Promise<any>
    }) {
        const { result } = inputs;
        let resolver: any;
        const promise = <Promise<TestResult>>new Promise(function (resolve) {
            resolver = resolve;
        });
        const bound = {
            resolver,
            result,
            startTime: inputs.startTime
        };
        inputs.promise.then(
            testPromiseSuccess.bind(null, bound),
            testPromiseFailure.bind(null, bound)
        );
        return promise;
    };

    const testPromiseSuccess = function TK_DebugTest_testPromiseSuccess(bound:{
        result: TestResult,
        startTime: number,
        resolver: GenericFunction
    }) {
        bound.result.time = Date.now() - bound.startTime;
        bound.resolver(bound.result);
    };

    const testPromiseFailure = function TK_DebugTest_testPromiseFailure(
        bound:{
            result: TestResult,
            startTime: number,
            resolver: GenericFunction
        }, reason:any
    ) {
        const {result} = bound;
        result.errorMessage = reason;
        result.time = Date.now() - bound.startTime;
        if (reason === undefined) {
            reason = "Unspecified Error"
        }
        result.errorMessage = reason;
        bound.resolver(result);
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();