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
    }[]): Promise<any>
}



(function TK_DebugTestAssertFailure_init() {
    const {areEqual} = ToolKid.dataTypes.checks;

    const publicExports = module.exports = <TK_DebugTest_file>{};



    publicExports.assertFailure = function TK_DebugTestAssertFailure_assertFailure(...inputs) {
        const promisedResults = <any[]>inputs
            .map(assertFailureSingle)
            .filter(isPromised);
        if (promisedResults.length === 0) {
            return Promise.resolve();
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

    const assertFailureError = function TK_DebugTestAssertFailure_assertFailureError(inputs: {
        name: string,
        error: Error,
        shouldThrow?: any
    }) {
        const { error, shouldThrow } = inputs;
        if (shouldThrow === Error) {
            if (!(error instanceof Error)) {
                return report({
                    name: inputs.name,
                    message: ["did not throw a real error object but threw:", error]
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

            const differences = areEqual({
                value: error,
                shouldBe: shouldThrow
            });
            if (differences !== true) {
                return report({
                    name: inputs.name,
                    message: ["did not throw expected message. threw:", error, "~details~", differences]
                });
            }
        }
        return undefined;
    };

    const isPromised = function (inputs: any) {
        return inputs !== undefined && inputs.promise instanceof Promise;
    };

    const report = function TK_DebugTestAssertFailure_report(inputs: {
        name: string,
        message: [string, ...any[]]
    }) {
        const { message } = inputs;
        return [
            "~ " + inputs.name + " ~ " + message[0],
            ...message.slice(1)
        ];
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();