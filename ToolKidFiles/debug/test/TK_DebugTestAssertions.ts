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

    createCondition(
        timeLimit?: number
    ): Condition,
    createCondition(inputs: number | {
        timeLimit: number,
        overTimeMessage?: any
    }): Condition
}

type Condition = Promise<any> & {
    succeed(
        value?: any
    ): void,
    fail(
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
            if (reworked.shouldBeAtLeast === undefined) {
                assertEquality(reworked);
            } else {
                assertEqualityAtLeast(reworked);
            }
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

    const assertEqualityAtLeast = function TK_DebugTestAssertions_assertEqualityAtLeast (inputs:{
        name: string,
        value: any,
        shouldBeAtLeast: any,
        toleranceDepth?: number
    }) {
        const { value, shouldBeAtLeast } = inputs;
        if (isIdentical(value, shouldBeAtLeast)) {
            return;
        } else if (isDifferentAndSimple(value, shouldBeAtLeast)) {
            throw report({
                name: inputs.name,
                message: ["value is:", value, "but should be at least equal to:", inputs.shouldBeAtLeast]
            });
        }

        const toleranceDepth = (inputs.toleranceDepth === undefined)
            ? 0 : inputs.toleranceDepth - 1;
        Object.entries(shouldBeAtLeast).forEach(function (keyValue) {
            assertEquality({
                name: keyValue[0],
                value: value[keyValue[0]],
                shouldBe: keyValue[1],
                toleranceDepth
            });
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



    publicExports.createCondition = function TK_DebugTestAssertions_createCondition(inputs) {
        const result = createCondition();
        if (inputs === undefined) {
            return result;
        }

        if (typeof inputs === "number") {
            inputs = {
                timeLimit:inputs,
                overTimeMessage:"timeout"
            };
        } else if (!(inputs instanceof Array)) {
            return result;
        }

        watchPromiseDuration({
            timeLimit: inputs.timeLimit,
            overTimeMessage: inputs.overTimeMessage,
            promise: result
        });
        return result;
    };

    const createCondition = function TK_DebugTestAssertions_createCondition() {
        let resolve: any, reject: any;
        const result = <Condition>new Promise(
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
        result.succeed = resolve;
        result.fail = reject;
        return result;
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