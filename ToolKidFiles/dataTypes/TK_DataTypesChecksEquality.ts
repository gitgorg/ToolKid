//secure data type checks
interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { checks: TK_DataTypesChecks_file }
interface TK_DataTypesChecks_file {
    areEqual(
        value: any,
        shouldBe: any
    ): true | EqualityDifference[],
    areEqual(inputs: {
        value: any,
        shouldBe: any,
        toleranceDepth?: number,
        allowAdditions?: true
    }): true | EqualityDifference[]
}

type EqualityDifference = {
    path: any[],
    type: "different" | "unwanted" | "invalid" | "tooDeep" | EqualityDifference[],
    value: any,
    shouldBe?: any
}

(function TK_DataTypesChecksEquality_init() {
    const publicExports = module.exports = <TK_DataTypesChecks_file>{};

    publicExports.areEqual = function TK_DataTypesChecksEquality_areEqual(...inputs: any[]) {
        if (inputs.length === 2) {
            return assertEqualityLoose({
                path: [], toleranceDepth: 1, value: inputs[0], shouldBe: inputs[1]
            });
        } else {
            return assertEqualityLoose(Object.assign({
                path: [], toleranceDepth: 1
            }, inputs[0]));
        }
    };

    const assertEqualityLoose = function TK_DataTypesChecksEquality_assertEqualityLoose(inputs: {
        value: any,
        shouldBe: any,
        toleranceDepth: number,
        path: any[],
        allowAdditions?: true
    }): true | EqualityDifference[] {
        const { value, shouldBe } = inputs;
        if (isIdentical(value, shouldBe)) {
            return true;
        }

        const simpleTestResult = isSimpleAndEqual(inputs);
        if (simpleTestResult === true) {
            return true;
        } else if (simpleTestResult !== false) {
            simpleTestResult.path = inputs.path;
            return [simpleTestResult];
        }

        const toleranceDepth = inputs.toleranceDepth - 1;
        const additionalKeys = new Set(getKeys(value));
        let reader = readProperty.basic;
        if (shouldBe instanceof Map) {
            reader = readProperty.Map;
        } else if (shouldBe instanceof Set) {
            reader = readProperty.Set;
        }
        let differences = <EqualityDifference[]>[];
        let returned: true | EqualityDifference[];
        getKeys(shouldBe).forEach(function (key) {
            additionalKeys.delete(key);
            returned = assertEqualityLoose(Object.assign(
                {}, inputs, {
                path: inputs.path.concat(key),
                value: reader(value, key),
                shouldBe: reader(shouldBe, key),
                toleranceDepth
            }
            ));
            if (returned !== true) {
                differences.push(...returned);
            }
        });
        if (additionalKeys.size !== 0 && inputs.allowAdditions !== true) {
            additionalKeys.forEach(function (key) {
                returned = reader(value, key);
                if (returned !== undefined) {
                    differences.push({
                        path: inputs.path.concat(key),
                        type: "unwanted",
                        value: returned
                    });
                }
            });
        }
        return (differences.length === 0)
            ? true
            : differences;
    };

    const getKeys = function TK_DataTypesChecksEquality_getKeys(value: any) {
        if (value instanceof Array) {
            return value.map(getKeysArray);
        } else if (value instanceof Map) {
            return Array.from(value.keys());
        } else if (value instanceof Set) {
            return Array.from(value);
        } else {
            return Object.keys(value);
        }
    };

    const getKeysArray = function TK_DebugTestAssertions(
        value: any, key: number
    ) {
        return key;
    };

    const isIdentical = function TK_DataTypesChecksEquality_isIdentical(
        valueA: any, valueB: any
    ) {
        return valueA === valueB
            || (Number.isNaN(valueB) && Number.isNaN(valueA));
    };

    const isList = function TK_DataTypesChecksEquality_isList(value: any) {
        return typeof value === "object" && value !== null || typeof value === "function";
    };

    const isSimpleAndDifferent = function TK_DataTypesChecksEquality_isSimpleAndDifferent(
        valueA: any, valueB: any
    ) {
        return typeof valueA !== typeof valueB
            || !isList(valueA) || !isList(valueB)
            || valueA instanceof Error || valueB instanceof Error;
    };

    const isSimpleAndEqual = function TK_DataTypesChecksEquality_isSimpleAndEqual(inputs: {
        value: any,
        shouldBe: any,
        toleranceDepth: number
    }): boolean | EqualityDifference {
        const { value, shouldBe } = inputs;
        if (typeof shouldBe === "function" && shouldBe.valueChecks instanceof Array) {
            if (shouldBe(value) === true) {
                return true;
            } else {
                return <EqualityDifference>{ type: "invalid", value, shouldBe };
            }
        };

        if (isSimpleAndDifferent(value, shouldBe)) {
            return <EqualityDifference>{ type: "different", value, shouldBe };
        } else if (inputs.toleranceDepth === 0) {
            return <EqualityDifference>{ type: "tooDeep", value };
        }

        return false;
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
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "dataTypes", subSection: "checks", functions: publicExports });
    }
})();