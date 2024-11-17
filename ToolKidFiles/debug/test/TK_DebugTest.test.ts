(function TK_DebugTest_test() {
    type TestPromise = Promise<void> & {
        reject(...inputs: any[]): void,
        resolve(...inputs: any[]): void
    }



    const { test, assertEquality, getResultGroup, SWITCH_RESULT_GROUP } = ToolKid.debug.test;

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
    let promisedResult = <Promise<TestResult>>test({
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

    SWITCH_RESULT_GROUP("TK_DebugTest");

    test({
        subject: getResultGroup,
        execute: function resultGroupSwitch() {
            const emptyGroup = getResultGroup();
            assertEquality({
                "empty resultGroup": {
                    value: emptyGroup,
                    shouldBe: {
                        name: "TK_DebugTest",
                        results: []
                    }
                }
            });
        }
    });

    const failingPromise = createPromise();
    failingPromise.reject();
    promisedResult = <Promise<TestResult>>test({
        subject: test,
        execute: function returnBadPromise() {
            return failingPromise;
        }
    })[0];
    
    SWITCH_RESULT_GROUP(currentResultGroup.name);

    test({
        subject: SWITCH_RESULT_GROUP,
        execute: function resultGroupSwitchBack() {
            assertEquality({
                "resultGroup": {
                    value: getResultGroup(),
                    shouldBe: currentResultGroup
                }
            });
        }
    });

    const expectingFailure = createPromise();
    test({
        subject: test,
        execute: function handleFailedPromise () {
            promisedResult.then(function (result) {
                assertEquality({
                    "testResult": {
                        value: result,
                        shouldBe: {
                            subject: test,
                            name: "returnBadPromise",
                            errorMessage: "Unspecified Error"
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