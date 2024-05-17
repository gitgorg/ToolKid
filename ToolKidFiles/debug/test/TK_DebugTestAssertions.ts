//testing for conditions and throw errors if not met
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    assertFailure(...inputs: {
        name: string,
        execute(...inputs: any[]): any | Promise<any>,
        withInputs?: any | any[],
        shouldThrow: any | ErrorConstructor,
        toleranceDepth?: number
    }[]): void | Promise<any>
    assertFailure(...inputs: {
        name: string,
        execute(...inputs: any[]): any | Promise<any>,
        withInputs?: any | any[],
        shouldThrowAny: true,
        toleranceDepth?: number
    }[]): void | Promise<any>,

    assertEquality(inputs: {
        name: string,
        value: any,
        shouldBe: any,
        toleranceDepth?: number
    }): void,
    assertEquality(inputs: {
        [name: string]: {
            value: any,
            shouldBe: any,
            toleranceDepth?: number
        }
    }): void
}



(function TK_DebugTestAssertions_init() {
    const publicExports = module.exports = <TK_DebugTest_file>{};

    const assureDeep = function TK_DebugTestAssertions_assureDeep(inputs: {
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

    const isPromised = function (inputs: any) {
        return inputs !== undefined && inputs.promise instanceof Promise;
    };

    publicExports.assertFailure = function TK_DebugTestAssertions_assertFailure(...inputs) {
        const promised = <any[]>inputs
            .map(assertFailureSingle)
            .filter(isPromised);
        if (promised.length === 0) {
            return;
        }

        let rejecter: GenericFunction, resolver: GenericFunction;
        const resultPromise = new Promise(function (resolve, reject) {
            rejecter = reject;
            resolver = resolve;
        });

        let count = promised.length;
        promised.forEach(function (inputs: {
            inputs: Dictionary,
            promise: Promise<any>
        }) {
            inputs.promise.then(function (reason) {
                rejecter(report({
                    name: inputs.inputs.name,
                    message: ["promise did not reject as expected"]
                }));
            }, function (reason) {
                const failureMessage = assertFailureCheck(
                    <any>inputs.inputs, reason
                );
                if (failureMessage !== undefined) {
                    rejecter(failureMessage);
                }

                count -= 1;
                if (count === 0) {
                    resolver();
                }
            });
        });
        return resultPromise;
    };

    const assertFailureSingle = function UnitTest_assertFailureSingle(inputs: {
        name: string,
        execute(...inputs: any[]): void,
        withInputs?: any | any[],
        shouldThrowAny?: true,
        shouldThrow?: any | ErrorConstructor,
        toleranceDepth?: number
    }) {
        if (typeof inputs.execute !== "function") {
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
            shouldThrowAny?: true,
            shouldThrow?: any
        }, error: Error
    ) {
        if (bound.shouldThrowAny === true) {
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

    publicExports.assertEquality = function TK_DebugTestAssertions_assertEqualityLoop(...inputs) {
        if (inputs.length === 1) {
            const firstInputs = inputs[0];
            if (firstInputs.name === undefined) {
                assertEqualityMode2(firstInputs);
                return;
            }
        }
        inputs.forEach(assertEquality);
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

        assureDeep({
            inputs,
            toleranceDepth: inputs.toleranceDepth || 1
        });
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

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();