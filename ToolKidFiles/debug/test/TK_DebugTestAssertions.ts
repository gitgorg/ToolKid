//testing for conditions and throw errors if not met
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    assertEquality(inputs: {
        [name: string]: {
            value: any,
            shouldBe: any,
            toleranceDepth?: number
        } | {
            value: any,
            shouldBeAtLeast: any,
            toleranceDepth?: number
        }
    }): void,

    condition(
        name?: string
    ): Condition,
    condition(
        timeLimit: number
    ): Condition,
    condition(inputs: {
        timeLimit: number,
        overTimeMessage?: any,
        registerWithName?: string
    }): Condition
}

type Condition = Promise<any> & {
    succeed(
        value?: any
    ): void,
    fail(
        reason?: any
    ): void,
    done: boolean
}



(function TK_DebugTestAssertions_init() {
    const publicExports = module.exports = <TK_DebugTest_file>{};

    publicExports.assertEquality = function TK_Debug_assertEquality(...inputs) {
        inputs.forEach(function TK_DebugTestAssertions_testForEquealityPerInput(inputs: Dictionary) {
            Object.entries(inputs).forEach(assertEqualityPerName);
        });
    };

    const assertEqualityPerName = function TK_Debug_assertEqualityPerName(
        nameAndValue: [name: string, value: any]
    ) {
        if (nameAndValue[1].shouldBeAtLeast === undefined) {
            assertEqualityRegular(...nameAndValue);
        } else {
            assertEqualityLoose(Object.assign(
                {name:nameAndValue[0], path:[]},
                nameAndValue[1]
            ));
        }
    };

    const fastResponse = function TK_DebugTestAssertions_fastResponse(path:any[], details: {
        value: any,
        shouldBe: any,
        toleranceDepth?: number
    }): boolean | [string, ...any[]] {
        const { value, shouldBe } = details;
        if (isIdentical(value, shouldBe)) {
            return true;
        } else if (isDifferentAndSimple(value, shouldBe)) {
            const location = path.length === 0
                ?"value"
                :["value",...path].join(".");
            return [location + " is:", value, "but should be equal to:", shouldBe];
        } else if (details.toleranceDepth === 0) {
            return ["differences not tollerated between value:", value, " and :", shouldBe]
        }

        return false;
    };

    const assertEqualityRegular = function TK_DebugTestAssertions_assertEqualityRegular(
        name: string,
        details: {
            value: any,
            shouldBe: any,
            toleranceDepth?: number
        }
    ) {
        const response = fastResponse([],details);
        if (response === true) {
            return;
        } else if (response !== false) {
            throw report({
                name, message: response
            });
        }

        assertEqualityDeep({
            name,
            value: details.value,
            shouldBe: details.shouldBe,
            toleranceDepth: details.toleranceDepth || 1
        });
    };

    const assertEqualityDeep = function TK_DebugTestAssertions_assertEqualityDeep(inputs: {
        name: string,
        value: any,
        shouldBe: any,
        toleranceDepth: number
    }) {
        const difference = ToolKid.object.compareDeep(
            inputs.value,
            inputs.shouldBe
        );
        if (difference.count !== 0) {
            throw report({
                name: inputs.name,
                message: ["value is:", inputs.value, "but should be equal to:", inputs.shouldBe, "difference:", difference]
            });
        }
    };

    const assertEqualityLoose = function TK_DebugTestAssertions_assertEqualityLoose(inputs:{
        name: string,
        value: any,
        shouldBeAtLeast: any,
        toleranceDepth?: number
        path: any[]
    }) {
        const { value, shouldBeAtLeast } = inputs;
        let toleranceDepth = (inputs.toleranceDepth === undefined)
            ? 1 : inputs.toleranceDepth;
        const response = fastResponse(
            inputs.path,
            {
                value,
                shouldBe: shouldBeAtLeast,
                toleranceDepth
            }
        );
        if (response === true) {
            return;
        } else if (response !== false) {
            throw report({
                name: inputs.name, message: response
            });
        }

        toleranceDepth -= 1;
        Object.entries(shouldBeAtLeast).forEach(function (keyValue) {
            const key = keyValue[0];
            assertEqualityLoose(Object.assign(
                {},
                inputs, {
                    path: inputs.path.concat(key),
                    value: value[key],
                    shouldBeAtLeast: keyValue[1],
                    toleranceDepth
                }
            ));
        });
    };



    const registeredConditions = new Map();
    publicExports.condition = function TK_DebugTestAssertions_condition(inputs) {
        if (typeof inputs === "string") {
            const found = registeredConditions.get(inputs);
            if (found !== undefined) {
                return found;
            }

            const result = conditionCreate();
            result.fail("unregistered condition: \"" + inputs + "\"");
            return result;
        }

        if (inputs === undefined) {
            return conditionCreate();
        }

        inputs = conditionInputs(inputs);
        const result = conditionCreate();
        watchPromiseDuration({
            timeLimit: inputs.timeLimit,
            overTimeMessage: inputs.overTimeMessage,
            promise: result
        });
        if (typeof inputs.registerWithName === "string") {
            registeredConditions.set(inputs.registerWithName, result);
        }
        return result;
    };

    const conditionCreate = function TK_DebugTestAssertions_conditionCreate() {
        let resolve: any, reject: any;
        const result = <Condition>new Promise(
            function createPromise_setup(resolveFunction, rejectFunction) {
                resolve = function TK_DebugTestAssertions_PromiseResolve(value: any) {
                    result.done = true;
                    resolveFunction(value);
                };
                reject = function TK_DebugTestAssertions_PromiseReject(reason: any) {
                    result.done = true;
                    rejectFunction(reason);
                }
            }
        );
        result.succeed = resolve;
        result.fail = reject;
        result.done = false;
        return result;
    };

    const conditionInputs = function TK_DebugTestAssertions_conditionInputs (inputs:any) {
        if (typeof inputs === "number") {
            return {
                timeLimit: inputs,
                overTimeMessage: "timeout"
            };
        }

        if (inputs.overTimeMessage === undefined) {
            inputs.overTimeMessage = "timeout";
        }
        return <{timeLimit:number, overtimeMessage: string}>inputs;
    };

    const isDifferentAndSimple = function TK_DebugTestAssertions_isDifferentAndSimple(
        valueA: any, valueB: any
    ) {
        return typeof valueA !== typeof valueB
            || !isList(valueA) || !isList(valueB);
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

    const watchPromiseDuration = function TK_DEBUG_TestAssertions_watchPromiseDuration(inputs: {
        timeLimit: number,
        overTimeMessage: string,
        promise: Condition
    }) {
        setTimeout(function TK_DEBUG_TestAssertions_watchPromiseDurationCheck() {
            if (inputs.promise.done !== true) {
                inputs.promise.fail(inputs.overTimeMessage);
            }
        }, inputs.timeLimit);
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();