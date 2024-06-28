//testing for conditions and throw errors if not met
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    condition(
        timeLimit?:number
    ): Condition,
    condition(inputs: {
        timeLimit: number,
        overTimeMessage?: any,
        registerWithName?: string
    }): Condition,
    condition(
        name: string
    ): Condition
}

type Condition = Promise<any> & {
    resolve(
        value?: any
    ): void,
    reject(
        reason?: any
    ): void,
    done: boolean
}



(function TK_DebugTestCondition_init() {
    const publicExports = module.exports = <TK_DebugTest_file>{};

    const registeredConditions = new Map();
    publicExports.condition = function TK_DebugTestCondition_condition(inputs) {
        if (typeof inputs === "string") {
            const found = registeredConditions.get(inputs);
            if (found !== undefined) {
                return found;
            }

            const result = conditionCreate();
            result.reject("unregistered condition: \"" + inputs + "\"");
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

    const conditionCreate = function TK_DebugTestCondition_conditionCreate() {
        let resolve: any, reject: any;
        const result = <Condition>new Promise(
            function createPromise_setup(resolveFunction, rejectFunction) {
                resolve = function TK_DebugTestCondition_PromiseResolve(value: any) {
                    result.done = true;
                    resolveFunction(value);
                };
                reject = function TK_DebugTestCondition_PromiseReject(reason: any) {
                    result.done = true;
                    rejectFunction(reason);
                }
            }
        );
        result.resolve = resolve;
        result.reject = reject;
        result.done = false;
        return result;
    };

    const conditionInputs = function TK_DebugTestCondition_conditionInputs (inputs:any) {
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

    const watchPromiseDuration = function TK_DEBUG_TestAssertion_watchPromiseDuration(inputs: {
        timeLimit: number,
        overTimeMessage: string,
        promise: Condition
    }) {
        setTimeout(function TK_DEBUG_TestAssertion_watchPromiseDurationCheck() {
            if (inputs.promise.done !== true) {
                inputs.promise.reject(inputs.overTimeMessage);
            }
        }, inputs.timeLimit);
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();