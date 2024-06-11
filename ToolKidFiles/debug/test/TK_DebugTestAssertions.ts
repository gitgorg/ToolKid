//testing for conditions and throw errors if not met
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    assertFailure(...inputs: {
        name: string,
        execute: Promise<any> | {(
            ...inputs: any[]
        ): any | Promise<any>},
        withInputs?: any | any[],
        shouldThrow?: any | ErrorConstructor,
        toleranceDepth?: number
    }[]): void | Promise<any>,

    assertEquality(inputs: {
        [name: string]: {
            value: any,
            shouldBe: any,
            toleranceDepth?: number
        } | {
            value: any,
            shouldPartiallyBe: any,
            toleranceDepth?: number
        }
    }): void,

    createPromise(
        maxDuration?: number | [maxDuration: number, reason: any]
    ): PromiseControllable
}

type PromiseControllable = Promise<any> & {
    resolve(
        value?: any
    ): void,
    reject(
        reason?: any
    ): void,
    done?: true
}



(function TK_DebugTestAssertions_init() {
    const publicExports = module.exports = <TK_DebugTest_file>{};

    publicExports.assertEquality = function TK_DebugTestAssertions_assertEqualityLoop(...inputs) {
        inputs.forEach(assertEqualityMode2);
    };

    const assertEqualityMode2 = function TK_DebugTestAssertions_testForEquealityMode2(inputs: Dictionary) {
        Object.entries(inputs).forEach(function (keyValue) {
            const reworked = Object.assign({}, keyValue[1], { name: keyValue[0] });
            assertEquality(reworked);
        });
    };

    const assertEquality = function TK_DebugTestAssertions_assertEquality(inputs: {
        name: string,
        value: any,
        shouldBe: any,
        toleranceDepth?: number
    }) {
        const { value, shouldBe } = inputs;
        if (isIdentical(value, shouldBe)) {
            return;
        } else if (isDifferentAndSimple(value, shouldBe)) {
            throw report({
                name: inputs.name,
                message: ["value is:", inputs.value, "but should be equal to:", inputs.shouldBe]
            });
        } else if (inputs.toleranceDepth === 0) {
            throw report({
                name: inputs.name,
                message: ["value is:", inputs.value, "but should be identical with:", inputs.shouldBe]
            });
        }

        assertEqualityDeep({
            inputs,
            toleranceDepth: inputs.toleranceDepth || 1
        });
    };


    const assertEqualityDeep = function TK_DebugTestAssertions_assertEqualityDeep(inputs: {
        inputs: {
            name: string,
            value: any,
            shouldBe: any
        },
        toleranceDepth: number
    }) {
        const difference = ToolKid.object.compareDeep(
            inputs.inputs.value,
            inputs.inputs.shouldBe
        );
        if (difference.count !== 0) {
            throw report({
                name: inputs.inputs.name,
                message: ["value is:", inputs.inputs.value, "but should be equal to:", inputs.inputs.shouldBe, "difference:", difference]
            });
        }
    };

    publicExports.assertFailure = function TK_DebugTestAssertions_assertFailure(...inputs) {
        const promisedResults = <any[]>inputs
            .map(assertFailureSingle)
            .filter(isPromised);
        if (promisedResults.length === 0) {
            return;
        }

        let rejecter: any, resolver: any;
        const resultPromise = new Promise(function (resolve, reject) {
            rejecter = reject;
            resolver = resolve;
        });

        promisedResults.forEach(assertFailureWatchPromise.bind(null, {
            count: promisedResults.length,
            rejecter,
            resolver
        }));
        return resultPromise;
    };

    const assertFailureWatchPromise = function (bound: Dictionary, inputs: {
        inputs: Dictionary,
        promise: Promise<any>
    }) {
        inputs.promise.then(function (reason) {
            bound.rejecter(report({
                name: inputs.inputs.name,
                message: ["promise did not reject as expected"]
            }));
        }, function (reason) {
            const failureMessage = assertFailureCheck(
                <any>inputs.inputs, reason
            );
            if (failureMessage !== undefined) {
                bound.rejecter(failureMessage);
            }

            bound.count -= 1;
            if (bound.count === 0) {
                bound.resolver();
            }
        });
    };

    const assertFailureSingle = function UnitTest_assertFailureSingle(inputs: {
        name: string,
        execute(...inputs: any[]): void,
        withInputs?: any | any[],
        shouldThrow?: any | ErrorConstructor,
        toleranceDepth?: number
    }) {
        if (inputs.execute instanceof Promise) {
            return {
                inputs,
                promise: inputs.execute
            };
        } else if (typeof inputs.execute !== "function") {
            throw report({
                name: inputs.name,
                message: ["execute is not a function, instead is:", inputs.execute]
            });
        }

        try {
            const returned = assertFailureExecute({
                execute: inputs.execute,
                withInputs: inputs.withInputs
            })
            if (returned instanceof Promise) {
                return {
                    inputs,
                    promise: returned
                };
            }

        } catch (error) {
            const failureMessage = assertFailureCheck(inputs, error);
            if (failureMessage !== undefined) {
                throw failureMessage;
            }
            return;
        }

        throw report({
            name: inputs.name,
            message: ["and did not fail as expected"]
        });
    };

    const assertFailureExecute = function TK_DebugTest_assertFailure(inputs: {
        execute: GenericFunction,
        withInputs: any
    }) {
        const { withInputs } = inputs;
        if (withInputs === undefined) {
            return inputs.execute();
        } else if (withInputs instanceof Array) {
            return inputs.execute(...withInputs);
        } else {
            return inputs.execute(withInputs);
        }
    };

    const assertFailureCheck = function (
        bound: {
            name: string,
            shouldThrow?: any
        }, error: Error
    ) {
        if (bound.shouldThrow === undefined) {
            return;
        }

        return assertFailureError({
            name: bound.name,
            error,
            shouldThrow: bound.shouldThrow
        });
    };

    const assertFailureError = function TK_DebugTestAssertions_assertFailureError(inputs: {
        name: string,
        error: Error,
        shouldThrow?: any
    }) {
        const { error, shouldThrow } = inputs;
        if (shouldThrow === Error) {
            if (!(error instanceof Error)) {
                return report({
                    name: inputs.name,
                    message: ["did not throw an error-object but threw:", error]
                });
            }
        } else {
            if (shouldThrow === error) {
                return;
            }

            if (typeof shouldThrow !== "object" || typeof error !== "object") {
                return report({
                    name: inputs.name,
                    message: [
                        "did not throw expected message. threw:", error,
                        "  instead of:", shouldThrow
                    ]
                });
            }

            const difference = ToolKid.object.compareDeep(
                error,
                shouldThrow
            );
            if (difference.count !== 0) {
                return report({
                    name: inputs.name,
                    message: ["did not throw expected message. threw:", error, "~details~", difference]
                });
            }
        }
        return undefined;
    };

    publicExports.createPromise = function TK_DebugTestAssertions_createPromise(inputs) {
        const result = createPromiseControllable();
        if (inputs === undefined) {
            return result;
        }

        if (typeof inputs === "number") {
            inputs = [inputs, "timeout"];
        } else if (!(inputs instanceof Array)) {
            return result;
        }

        watchPromiseDuration({
            duration: inputs[0],
            reason: inputs[1],
            promise: result
        });
        return result;
    };

    const createPromiseControllable = function TK_DebugTestAssertions_createPromiseControllable() {
        let resolve: any, reject: any;
        const result = <PromiseControllable>new Promise(
            function createPromise_setup(resolveFunction, rejectFunction) {
                resolve = function TK_DebugTestAssertions_PromiseResolve(value: any) {
                    result.done = true;
                    resolveFunction(value);
                };
                reject = function TK_DebugTestAssertions_PromiseReject (reason: any) {
                    result.done = true;
                    rejectFunction(reason);
                }
            }
        );
        result.resolve = resolve;
        result.reject = reject;
        return result;
    };

    const isDifferentAndSimple = function TK_DebugTestAssertions_isDifferentAndSimple(
        valueA: any, valueB: any
    ) {
        return typeof valueA !== typeof valueB
            || !isList(valueA);
    };

    const isIdentical = function TK_DebugTestAssertions_isIdentical(
        valueA: any, valueB: any
    ) {
        return valueA === valueB
            || (Number.isNaN(valueB) && Number.isNaN(valueA));
    };

    const isList = function TK_DebugTestAssertions_isList(value: any) {
        return typeof value === "object" && value !== null || typeof value === "function";
    };

    const isPromised = function (inputs: any) {
        return inputs !== undefined && inputs.promise instanceof Promise;
    };

    const report = function TK_DebugTestAssertions_report(inputs: {
        name: string,
        message: [string, ...any[]]
    }) {
        const { message } = inputs;
        return [
            "~ " + inputs.name + " ~ " + message[0],
            ...message.slice(1)
        ];
    };

    const watchPromiseDuration = function TK_DEBUG_TestAssertions_watchPromiseDuration(inputs: {
        duration: number,
        reason: string,
        promise: PromiseControllable
    }) {
        setTimeout(function TK_DEBUG_TestAssertions_watchPromiseDurationCheck() {
            if (inputs.promise.done !== true) {
                inputs.promise.reject(inputs.reason);
            }
        }, inputs.duration);
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();