(function TK_DebugTest_test() {
    type TestPromise = Promise<void> & {
        reject(...inputs: any[]): void,
        resolve(...inputs: any[]): void
    }



    const { test, assertEquality } = ToolKid.debug.test;

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
    let testPromise = <Promise<TestResult>>test({
        subject: test,
        execute: function returnGoodPromise() {
            return promiseSuccess;
        }
    })[0];
    promiseSuccess.resolve();
    testPromise.then(function (result) {
        assertEquality({
            "promise success result.name": {
                value: result.name,
                shouldBe: "returnGoodPromise"
            }
        });
    }).catch(throwError);

    //failure with promise
    const promiseFailure = createPromise();
    testPromise = <Promise<TestResult>>test({
        subject: test,
        execute: function returnBadPromise() {
            return promiseFailure;
        }
    })[0];
    promiseFailure.reject();
    testPromise.then(function (result) {
        assertEquality({
            "promise failure result.errorMessage": {
                value: result.errorMessage,
                shouldBe: "Unspecified Error"
            }
        });
        delete result.errorMessage;
    }).catch(throwError);



    //--- invalid tests

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