(function TK_DebugTest_test() {
    type TestPromise = Promise<void> & {
        reject(...inputs: any[]): void,
        resolve(...inputs: any[]): void
    }



    const { test, assertEquality, getResultGroup, setFailureHandler, shouldPass, switchResultGroup } = ToolKid.debug.test;

    const shouldBeInteger = shouldPass(function isNumber(value) { return Number.isInteger(value) });

    //setup helping functions
    const createPromise = function () {
        let resolver, rejecter;
        const result = <TestPromise>new Promise(function (
            resolve, reject
        ) {
            resolver = resolve;
            rejecter = reject;
        });
        result.resolve = <any>resolver;
        result.reject = <any>rejecter;
        return result;
    };

    const throwError = function (reason: any) {
        console.log("TK_Debug_test - failed");
        console.error(reason);
        throw reason;
    };



    //--- valid tests

    //success basic
    let value = 0;
    test({
        subject: test,
        execute: function () {
            value = 1;
        }
    });
    if (value !== 1) {
        throw ["TK_Debug_test - won't execute"];
    }

    //success with promise
    const promiseSuccess = createPromise();
    let promisedResult = <Promise<TKTestResult>>test({
        subject: test,
        execute: function returnGoodPromise() {
            return promiseSuccess;
        }
    })[0];
    promiseSuccess.resolve();
    promisedResult.then(function (result) {
        assertEquality({
            "promise success result.name": {
                value: result.name,
                shouldBe: "returnGoodPromise"
            }
        });
    }).catch(throwError);

    const currentResultGroup = getResultGroup();
    test({
        subject: getResultGroup,
        execute: function resultGroupSwitch() {
            assertEquality({
                "type of resultGroup.name": {
                    value: typeof currentResultGroup.name,
                    shouldBe: "string"
                },
                "resultGroup.results is array": {
                    value: currentResultGroup.results instanceof Array,
                    shouldBe: true
                }, "resultGroup has results": {
                    value: currentResultGroup.results.length === 0,
                    shouldBe: false
                }
            });
        }
    });

    switchResultGroup("TK_DebugTest");

    const failedResults = <any>[];
    setFailureHandler(failedResults.push.bind(failedResults));

    test({
        subject: getResultGroup,
        execute: function resultGroupSwitch() {
            assertEquality({
                "empty resultGroup": {
                    value: getResultGroup(),
                    shouldBe: {
                        name: "TK_DebugTest",
                        results: []
                    },
                    toleranceDepth: 3,
                }
            });
        }
    });

    test({
        subject: test,
        execute: function failSynchronous() {
            throw ["synchronous failure"];
        }
    });

    const failingPromise = createPromise();
    promisedResult = <Promise<TKTestResult>>test({
        subject: test,
        execute: function failAsynchronous() {
            return failingPromise;
        }
    })[0];
    setTimeout(failingPromise.reject.bind(null, "asynchronous failure"), 1000);

    switchResultGroup(currentResultGroup.name);

    test({
        subject: switchResultGroup,
        execute: function resultGroupSwitchBack() {
            assertEquality({
                "resultGroup": {
                    value: getResultGroup(),
                    shouldBe: currentResultGroup
                }
            });
        }
    });

    test({
        subject: setFailureHandler,
        execute: async function compareFailures() {
            await promisedResult.catch();
            assertEquality({
                "failed results": {
                    value: failedResults,
                    shouldBe: [{
                        subject: test,
                        name: "failSynchronous",
                        time: shouldBeInteger,
                        errorMessage: ["synchronous failure"],
                        errorSource: "TK_DebugTest.test",
                    }, {
                        subject: test,
                        name: "failAsynchronous",
                        time: shouldBeInteger,
                        errorMessage: "asynchronous failure",
                        errorSource: "TK_DebugTest.test",
                    }],
                    toleranceDepth: 3
                }
            });
        }
    });

    const expectingFailure = createPromise();
    test({
        subject: test,
        execute: function handleFailedPromise() {
            promisedResult.then(function (result) {
                assertEquality({
                    "testResult": {
                        value: result,
                        shouldBe: {
                            subject: test,
                            name: "failAsynchronous",
                            errorMessage: "asynchronous failure"
                        },
                        allowAdditions: true
                    },
                    "type of testResult.time": {
                        value: typeof result.time,
                        shouldBe: "number"
                    }
                });
                expectingFailure.resolve(result);
            }).catch(expectingFailure.reject);
            return expectingFailure;
        }
    });



    //--- invalid test configs

    //without config
    try {
        test();
    } catch (error) {
        value = 101;
    }
    if (value !== 101) {
        throw ["TK_Debug_test - missing inputs din't fail"];
    }

    //without subject
    try {
        test(<any>{ subject: null, execute: function () { } });
    } catch (error) {
        value = 102;
    }
    if (value !== 102) {
        throw ["TK_Debug_test - invalid subject did n't fail"];
    }

    //without execution function
    try {
        test(<any>{ subject: test, execute: null });
    } catch (error) {
        value = 103;
    }
    if (value !== 103) {
        throw ["TK_Debug_test - invalid execute did n't fail"];
    }
})();