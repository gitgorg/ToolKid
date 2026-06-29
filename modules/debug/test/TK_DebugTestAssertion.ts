//testing for conditions and throw errors if not met
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    assert(
        label: string,
        value: GenericFunction,
        shouldBe: typeof Error
    ): void,
    assert(
        label: string,
        value: Promise<any>,
        shouldBe: any
    ): Promise<void>,
    assert(
        label: string,
        value: any,
        shouldBe: any
    ): void,
    assert(inputs: {
        [label: string]: [value: any, shouldBe: any] | ({
            value: any,
            shouldBe: any,
        } & TK_AssertConfig),
    }): void | Promise<void>,
    assert(inputs: {
        CONFIG?: TK_AssertConfig,
        [label: string]:
        [value: any, shouldBe: any] //short notation
        | ({  //regular notation
            value: any,
            shouldBe: any,
        } & TK_AssertConfig)
        | TK_AssertConfig //only allowed for CONFIG property,
        | undefined
    }): void,
    assertEquality(inputs: {
        [name: string]: {
            value: any,
            shouldBe: any,
        } & TK_AssertConfig
    }): void
}

type TK_AssertConfig = {
    allowAdditions?: true,
    catchFailure?: {
        (errorMessage: [
            description: string,
            ...details: any[]
        ]): void
    },
    toleranceDepth?: number,
    passOnDepthExceed?: true,
}



(function TK_DebugTestAssertion_init() {
    type PromiseInternals = {
        errors: any[],
        reject: GenericFunction,
        resolve: GenericFunction,
        count: number,
    }



    const defaultConfig = {};
    const empty = function TK_DebugTestAssertion_empty() { };
    const promiseInternals: PromiseInternals = {
        errors: [],
        reject: empty,
        resolve: empty,
        count: 0,
    };

    const publicExports = module.exports = <TK_DebugTest_file>{};



    publicExports.assert = function TK_DebugTestAssertion_assert(
        ...inputs: any[]
    ): any {
        const promises = [] as Dictionary[];
        const errors = [] as (string | EqualityDifference)[];
        if (arguments.length === 3) {
            assertOne(promises, errors, inputs[0], { value: inputs[1], shouldBe: inputs[2] });
            if (errors.length !== 0) {
                throw errors;
            } else if (promises.length !== 0) {
                return promises[0].promise;
            }
            return;
        }

        if (arguments.length !== 1) {
            throw ["TK_DebugTestAssertion_assert - takes 3 arguments (label, value, expectedValue) or one config object, not:", arguments.length, "inputs:", arguments];
        }

        const entries = Object.entries(inputs[0]);
        const { length } = entries;
        const config = inputs[0].CONFIG || defaultConfig;
        for (let i = 0; i < length; i += 1) {
            assertComplex(promises, errors, config, entries[i]);
        }
        if (errors.length !== 0) {
            throw errors;
        } else if (promises.length !== 0) {
            return promises[0].promise;
        }
    };

    const assertComparison = function TK_DebugTestAssertion_assertComparison(
        errors: any[],
        label: string,
        config: Dictionary
    ) {
        const returned = ToolKid.dataTypes.checks.areEqual(<any>config);
        if (returned === true) {
            return;
        }

        let errorMessage: any[];
        if (config.passOnDepthExceed === true) {
            const cleaned = returned.filter(isNotTooDeep);
            if (cleaned.length === 0) {
                return;
            }

            errorMessage = ["~ " + label + " ~ value did not meet expectations:", ...cleaned];
        } else {
            errorMessage = ["~ " + label + " ~ value did not meet expectations:", ...returned];
        }
        if (typeof config.catchFailure === "function") {
            config.catchFailure(errorMessage);
        } else {
            errors.push(...errorMessage);
        }
    };

    const assertComplex = function TK_DebugTestAssertion_assertComplex(
        promises: Dictionary[],
        errors: (string | EqualityDifference)[],
        baseConfig: TK_AssertConfig,
        nameAndConfig: [string, any],
    ) {
        const [, config] = nameAndConfig;
        if (isShortConfig(config)) {
            assertOne(
                promises, errors,
                nameAndConfig[0], {
                ...baseConfig,
                value: config[0],
                shouldBe: config[1]
            });
        } else {
            assertOne(
                promises, errors,
                nameAndConfig[0], {
                ...baseConfig,
                ...nameAndConfig[1]
            });
        }
    };

    publicExports.assertEquality = function TK_Debug_assertEquality(inputs) {
        const errors = <(string | EqualityDifference)[]>[];
        const entries = Object.entries(inputs);
        const { length } = entries;
        let entry;
        for (let i = 0; i < length; i += 1) {
            entry = entries[i];
            assertOne([], errors, entry[0], entry[1]);
        }
        if (errors.length !== 0) {
            throw errors;
        }
    };

    const assertOne = function TK_Debug_assertOne(
        promises: Dictionary[],
        errors: (string | EqualityDifference)[],
        label: string,
        config: Dictionary
    ) {
        if (config.shouldBe === Error) {
            // crash on execution expected
            if (typeof config.value !== "function") {
                errors.push(...["~ " + label + " ~ value needs to be a function in order to test for failure but is: ", config.value]);
                return;
            }

            let returned;
            try {
                returned = config.value();
            } catch (error) {
                return; // crash happened - all good
            }

            errors.push(...["~ " + label + " ~ value did not fail - it returned:", returned]);
            return;
        }

        if (!(config.value instanceof Promise)) {
            assertComparison(errors, label, config);
            return;
        }

        if (promises.length === 0) {
            promises[0] = assertPromise(errors, label, <any>config);
        } else {
            promises[0].add(label, config);
        }
    };

    const assertPromise = function TK_DebugTestAssertion_assertPromise(
        errors: any[],
        label: string,
        config: { value: Promise<any>, shouldBe: any } & TK_AssertConfig
    ) {
        const internals = Object.assign({}, promiseInternals);
        internals.errors = errors;
        internals.resolve = resolve.bind(null, internals);
        internals.reject = reject.bind(null, internals);
        const promise = new Promise(function TK_DebugTestAssertion_assertPromiseCreate(
            resolve, reject
        ) {
            internals.resolve = resolve;
            internals.reject = reject;
        });
        const add = function TK_DebugTestAssertion_assertPromiseAdd(
            label: string,
            config: { value: Promise<any>, shouldBe: any } & TK_AssertConfig,
        ) {
            internals.count += 1;
            config.value.then(
                resolve.bind(null, internals, label, config),
                reject.bind(null, internals, label)
            );
        };
        add(label, config);
        return { promise, add };
    };

    const reject = function TK_DebugTestAssertion_reject(
        internals: PromiseInternals,
        label: string,
        reason: any
    ) {
        internals.errors.push("~ " + label + " ~ promise rejected:", reason);
        if (internals.count === 1) {
            internals.reject(internals.errors);
        } else {
            internals.count -= 1;
        }

    }

    const resolve = function TK_DebugTestAssertion_resolve(
        internals: PromiseInternals,
        label: string,
        config: Dictionary,
        data: any
    ) {
        config.value = data;
        const { errors } = internals;
        assertComparison(errors, label, config);
        if (internals.count === 1) {
            if (errors.length === 0) {
                internals.resolve(data);
            } else {
                internals.reject(errors);
            }
        } else {
            internals.count -= 1;
        }
    }

    const isNotTooDeep = function TK_DebugTestAssertion_isNotToDeep(
        difference: EqualityDifference
    ) {
        return difference.type !== "tooDeep";
    };

    const isShortConfig = (typeof Array.isArray === "function")
        ? function TK_DebugTestAssertion_isShortConfig(value: any) {
            return Array.isArray(value) && value.length === 2;
        } : function TK_DebugTestAssertion_isShortConfigLegacy(value: any) {
            return value instanceof Array && value.length === 2;
        };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "test", entries: publicExports });
    }
})();