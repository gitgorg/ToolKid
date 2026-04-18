//testing for conditions and throw errors if not met
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    // awaiting condition
    condition(
        name: string
    ): Condition,

    createCondition(
        timeToResolve?: number
    ): Condition,
    createCondition(inputs: {
        timeToResolve: number,
        timeoutMessage?: any,
        registerWithName?: string,
    }): Condition,
    createCondition(inputs: {
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
    const waitingConditions = <Map<string, Condition[]>>new Map();
    publicExports.condition = function TK_DebugTestCondition_condition(inputs) {
        if (typeof inputs !== "string") {
            return createCondition(<Parameters<TK_DebugTest_file["createCondition"]>[0]>inputs);
        }

        const found = registeredConditions.get(inputs);
        if (found !== undefined) {
            return found;
        }

        let queue = waitingConditions.get(inputs);
        const result = conditionCreate();
        if (queue === undefined) {
            queue = [result];
            waitingConditions.set(inputs, queue);
        } else {
            queue.push(result);
        }
        setTimeout(function () {
            if (registeredConditions.get(inputs) === undefined) {
                result.reject("waiting for unknown condition: \"" + inputs + "\"");
            }
        }, 5000);
        return result;
    };

    const createCondition = publicExports.createCondition = function TK_DebugTestCondition_createCondition(inputs) {
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
        if (typeof inputs.registerWithName !== "string") {
            return result;
        }

        const name = inputs.registerWithName;
        registeredConditions.set(name, result);
        const queue = waitingConditions.get(name);
        if (queue !== undefined) {
            result
                .then(triggerConditions.bind(null, queue, "resolve"))
                .catch(triggerConditions.bind(null, queue, "reject"));
            waitingConditions.delete(name);
        }
        return result;
    };

    const triggerConditions = function TK_DebugTestCondition_triggerConditions(
        queue: Condition[], mode: "resolve" | "reject", value: any
    ) {
        for (const condition of queue) {
            condition[mode](value);
        }
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
        registerWithName?: string,
    }, promise: Condition) {
        const config = (typeof inputs.timeToResolve === "number")
            ? ["resolve", inputs.timeToResolve] as ["resolve", number]
            : ["reject", inputs.timeToReject] as ["reject", number];
        setTimeout(function TK_DebugTestCondition_watchPromiseDurationCheck() {
            if (promise.done !== true) {
                promise[config[0]](
                    inputs.timeoutMessage
                    || (inputs.registerWithName === undefined
                        ? "timeout"
                        : inputs.registerWithName + " timed out"
                    )
                );
            }
        }, config[1]);

    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "test", entries: publicExports });
    }
})();