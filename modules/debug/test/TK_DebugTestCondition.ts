//testing for conditions and throw errors if not met
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    // awaiting condition
    condition(
        name: string
    ): Condition,

    // creating condition
    condition(
        timeToResolve?: number
    ): Condition,
    condition(inputs: {
        timeToResolve: number,
        timeoutMessage?: any,
        registerWithName?: string,
    }): Condition,
    condition(inputs: {
        timeToReject: number,
        timeoutMessage?: any,
        registerWithName?: string,
    }): Condition,
}

type Condition = Promise<any> & {
    resolve(
        value?: any
    ): void,
    reject(
        reason?: any
    ): void,
    done: boolean,
    timePassed: number
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

        if (typeof inputs === "number") {
            inputs = { timeToResolve: inputs };
        }
        const result = conditionCreate();
        if (typeof (<any>inputs).timeToResolve === "number" || typeof (<any>inputs).timeToReject === "number") {
            watchPromiseDuration(<any>inputs, result);
        }
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
                    (<any>result).timePassed = Date.now() - startTime;
                    result.done = true;
                    if (arguments.length === 0) {
                        value = (<any>result).timePassed;
                    }
                    resolveFunction(value);
                };
                reject = function TK_DebugTestCondition_PromiseReject(reason: any) {
                    (<any>result).timePassed = Date.now() - startTime;
                    result.done = true;
                    if (arguments.length === 0) {
                        reason = (<any>result).timePassed;
                    }
                    rejectFunction(reason);
                }
            }
        );
        result.resolve = resolve;
        result.reject = reject;
        result.done = false;
        result.timePassed = 0;
        const startTime = Date.now();
        return result;
    };

    const watchPromiseDuration = function TK_DebugTestCondition_watchPromiseDuration(inputs: {
        timeToResolve?: number,
        timeToReject?: number,
        timeoutMessage: string,
    }, promise: Condition) {
        const config = (typeof inputs.timeToResolve === "number")
            ? ["resolve", inputs.timeToResolve] as ["resolve", number]
            : ["reject", inputs.timeToReject] as ["reject", number];
        setTimeout(function TK_DebugTestCondition_watchPromiseDurationCheck() {
            if (promise.done !== true) {
                promise[config[0]](inputs.timeoutMessage || "timeout");
            }
        }, config[1]);

    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "test", entries: publicExports });
    }
})();