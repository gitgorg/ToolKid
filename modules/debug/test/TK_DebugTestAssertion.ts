//testing for conditions and throw errors if not met
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    assert(
        label: string,
        value: Promise<any>,
        shouldBe: any
    ): Promise<void>,
    assert(
        label: string,
        value: GenericFunction,
        shouldBe: typeof Error
    ): void,
    assert(
        label: string,
        value: any,
        shouldBe: any
    ): void,
    assert(inputs: {
        [label: string]: [value: any, shouldBe: any] | ({
            value: any,
            shouldBe: any,
        }),
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
    logValue?: true,
    toleranceDepth?: number,
    toleranceDepthExceedFails?: false,
}



(function TK_DebugTestAssertion_init() {
    type PromiseInternals = {
        errors: any[],
        reject: GenericFunction,
        resolve: GenericFunction,
        count: number,
    }



    const defaultConfig = {};
    const doNothing = function TK_DebugTestAssertion_doNothing() { };
    const promiseInternals: PromiseInternals = {
        errors: [],
        reject: doNothing,
        resolve: doNothing,
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
            throw ["TK_DebugTestAssertion_assert - takes 1 config argument or the following 3 arguments: label, value, shouldBe. Not the ", arguments.length, " arguments: ", ...arguments];
        }

        let i = 1;
        let config = inputs[0].CONFIG;
        if (config === undefined) {
            config = defaultConfig;
            i = 0;
        };
        const entries = Object.entries(inputs[0]);
        const { length } = entries;
        for (; i < length; i += 1) {
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
        if (config.logValue === true) {
            ToolKid.debug.terminal.logImportant(label, config.value);
        }
        const returned = ToolKid.dataTypes.checks.areEqual(<any>config);
        if (returned === true) {
            return;
        }

        let errorMessage: any[];
        if (config.toleranceDepthExceedFails === false) {
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
        config: { value: any, shouldBe: any } & TK_AssertConfig
    ) {
        if (config.shouldBe !== Error) {
            if (!(config.value instanceof Promise)) {
                assertComparison(errors, label, config);
                return;
            }

            if (promises.length === 0) {
                promises[0] = assertPromise(errors, label, config);
            } else {
                promises[0].add(label, config);
            }
            return;
        }

        // crash on execution expected
        const { value } = config;
        if (value instanceof Promise) {
            if (promises.length === 0) {
                promises[0] = assertPromise(errors, label, <any>config);
            } else {
                promises[0].add(label, config);
            }
            return;
        }

        if (typeof value !== "function") {
            errors.push(...["~ " + label + " ~ value needs to be a function in order to test for failure but is: ", value]);
            return;
        }

        let returned;
        try {
            returned = value();
        } catch (error) {
            return; // crash happened - all good
        }

        errors.push(...["~ " + label + " ~ value did not fail - it returned:", returned]);
        return;
    };

    const assertPromise = function TK_DebugTestAssertion_assertPromise(
        errors: any[],
        label: string,
        config: { value: Promise<any>, shouldBe: any } & TK_AssertConfig
    ) {
        const internals = Object.assign({}, promiseInternals);
        internals.errors = errors;
        assertPromiseAdd(internals, label, config);
        return {
            promise: new Promise(function TK_DebugTestAssertion_assertPromiseCreate(
                resolve, reject
            ) {
                internals.resolve = resolve;
                internals.reject = reject;
            }),
            add: assertPromiseAdd.bind(null, internals)
        };
    };

    const assertPromiseAdd = function TK_DebugTestAssertion_assertPromiseAdd(
        internals: PromiseInternals,
        label: string,
        config: { value: Promise<any>, shouldBe: any } & TK_AssertConfig,
    ) {
        internals.count += 1;
        config.value.then(
            resolvePromise.bind(null, internals, label, config),
            rejectPromise.bind(null, internals, label, config)
        );
    };

    const rejectPromise = function TK_DebugTestAssertion_rejectPromise(
        internals: PromiseInternals,
        label: string,
        config: { value: Promise<any>, shouldBe: any } & TK_AssertConfig,
        reason: any,
    ) {
        config.value = reason;
        if (config.shouldBe !== Error) {
            internals.errors.push("~ " + label + " ~ promise rejected:", reason);
        }
        assertFinalize(internals, reason);
    }

    const resolvePromise = function TK_DebugTestAssertion_resolvePromise(
        internals: PromiseInternals,
        label: string,
        config: { value: Promise<any>, shouldBe: any } & TK_AssertConfig,
        value: any,
    ) {
        config.value = value;
        if (config.shouldBe === Error) {
            internals.errors.push("~ " + label + " ~ promise did not fail - it returned:", value);
        } else {
            assertComparison(internals.errors, label, config);
        }
        assertFinalize(internals, value);
    };

    const assertFinalize = function TK_DebugTestAssertFinalize(
        internals: PromiseInternals,
        value: any,
    ) {
        if (internals.count === 1) {
            if (internals.errors.length === 0) {
                internals.resolve(value);
            } else {
                internals.reject(internals.errors);
            }
        } else {
            internals.count -= 1;
        }
    };

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