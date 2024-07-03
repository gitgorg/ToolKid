//testing for conditions and throw errors if not met
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    assertEquality(inputs: {
        [name: string]: {
            value: any,
            shouldBe: any,
            toleranceDepth?: number,
            allowAdditions?: true
        }
    }): void
}



(function TK_DebugTestAssertion_init() {
    const publicExports = module.exports = <TK_DebugTest_file>{};

    publicExports.assertEquality = function TK_Debug_assertEquality(...inputs) {
        inputs.forEach(function TK_DebugTestAssertion_testForEquealityPerInput(inputs: Dictionary) {
            Object.entries(inputs).forEach(assertEqualityPerName);
        });
    };

    const assertEqualityPerName = function TK_Debug_assertEqualityPerName(
        nameAndValue: [name: string, value: any]
    ) {
        const settings = Object.assign({}, nameAndValue[1]);
        if (typeof settings.toleranceDepth !== "number") {
            settings.toleranceDepth = 1;
        }
        assertEqualityLoose(Object.assign(
            { name: nameAndValue[0], path: [] },
            settings
        ));
    };

    const assertEqualityLoose = function TK_DebugTestAssertion_assertEqualityLoose(inputs: {
        name: string,
        value: any,
        shouldBe: any,
        toleranceDepth: number,
        path: any[],
        allowAdditions?: true
    }) {
        const simpleTestResult = isSimpleAndEqual(inputs);
        if (simpleTestResult === true) {
            return;
        } else if (simpleTestResult instanceof Array) {
            throw report({ inputs, message: simpleTestResult });
        }

        const { value, shouldBe } = inputs;
        const toleranceDepth = inputs.toleranceDepth - 1;
        const additionalKeys = new Set(getKeys(value));
        let reader = readProperty.basic;
        if (shouldBe instanceof Map) {
            reader = readProperty.Map;
        } else if (shouldBe instanceof Set) {
            reader = readProperty.Set;
        }
        getKeys(shouldBe).forEach(function (key) {
            additionalKeys.delete(key);
            assertEqualityLoose(Object.assign(
                {},
                inputs, {
                path: inputs.path.concat(key),
                value: reader(value, key),
                shouldBe: reader(shouldBe, key),
                toleranceDepth,
                allowAdditions: inputs.allowAdditions
            }
            ));
        });
        if (additionalKeys.size !== 0 && inputs.allowAdditions !== true) {
            const cleaned = new Map();
            additionalKeys.forEach(function (key) {
                const abundantValue = reader(value, key);
                if (abundantValue !== undefined) {
                    cleaned.set(key, abundantValue);
                }
            });
            if (cleaned.size !== 0) {
                throw [buildPathName(inputs.path) + " has unwanted properties:", cleaned];
            }
        }
    };

    const buildPathName = function (path: any[]) {
        if (path.length === 0) {
            return "value";
        }

        let result = "value";
        path.forEach(function (part) {
            if (typeof part === "function") {
                result += ".>>function:" + part.name + "<<";
            } else {
                result += "." + part;
            }
        });
        return result;
    };

    const getKeys = function TK_DebugTestAssertion_getKeys(value: any) {
        if (value instanceof Map) {
            return Array.from(value.keys());
        } else if (value instanceof Set) {
            return Array.from(value);
        } else {
            return Object.keys(value);
        }
    };

    const readProperty = {
        basic: function (container: any, key: any) {
            return container[key];
        },
        Set: function (container: Set<any>, key: any) {
            return container.has(key);
        },
        Map: function (
            container: Map<any, any>,
            key: any
        ) {
            return container.get(key);
        }
    }

    const isIdentical = function TK_DebugTestAssertion_isIdentical(
        valueA: any, valueB: any
    ) {
        return valueA === valueB
            || (Number.isNaN(valueB) && Number.isNaN(valueA));
    };

    const isList = function TK_DebugTestAssertion_isList(value: any) {
        return typeof value === "object" && value !== null || typeof value === "function";
    };

    const isSimpleAndDifferent = function TK_DebugTestAssertion_isSimpleAndDifferent(
        valueA: any, valueB: any
    ) {
        return typeof valueA !== typeof valueB
            || !isList(valueA) || !isList(valueB);
    };

    const isSimpleAndEqual = function TK_DebugTestAssertion_isSimpleAndEqual(inputs: {
        value: any,
        shouldBe: any,
        toleranceDepth: number
    }): boolean | [string, ...any[]] {
        const { value, shouldBe } = inputs;
        if (isIdentical(value, shouldBe)) {
            return true;
        }

        if (typeof shouldBe === "function" && shouldBe.valueChecks instanceof Array) {
            if (shouldBe(value) === true) {
                return true;
            } else {
                return [":", value, " didn't pass check - should " + shouldBe.to + " " + shouldBe.wants + " of ", shouldBe.valueChecks];
            }
        }

        if (isSimpleAndDifferent(value, shouldBe)) {
            return [" is:", value, "but should be equal to:", shouldBe];
        } else if (inputs.toleranceDepth === 0) {
            return [" exceeds tolerance depth:", value];
        }

        return false;
    };

    const report = function TK_DebugTestAssertion_report(inputs: {
        inputs: Dictionary,
        message: [string, ...any[]]
    }) {
        const { message } = inputs;
        return [
            "~ " + inputs.inputs.name + " ~ " + buildPathName(inputs.inputs.path) + message[0],
            ...message.slice(1)
        ];
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();