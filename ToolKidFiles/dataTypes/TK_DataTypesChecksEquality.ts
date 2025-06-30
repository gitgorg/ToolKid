//secure data type checks
interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { checks: TK_DataTypesChecks_file }
interface TK_DataTypesChecks_file {
    areEqual(
        value: any,
        shouldBe: any
    ): true | EqualityDifference[]
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

    publicExports.areEqual = function TK_DataTypesChecksEquality_areEqual(inputs) {
        if (arguments.length === 2) {
            return assertEqualityLoose(
                [], arguments[0], arguments[1],
                1, false
            );
        } else {
            return assertEqualityLoose(
                [], inputs.value, inputs.shouldBe,
                (typeof inputs.toleranceDepth === "number") ? inputs.toleranceDepth: 1,
                inputs.allowAdditions === true
            );
        }
    };

    const differentiators = {
        set: function TK_DataTypesChecksEquality_diffSet(
            path: any[], value: Set<any>, shouldBe: Set<any>
        ) {
            if (!(shouldBe instanceof Set)) {
                return [<EqualityDifference>{
                    type: "different", value, shouldBe, path
                }];
            }

            const differences = <EqualityDifference[]>[];
            shouldBe.forEach(function (entry) {
                if (!value.has(entry)) {
                    differences.push({
                        type: "different",
                        value: undefined,
                        shouldBe: entry,
                        path: [...path, entry]
                    });
                }
            });
            value.forEach(function (entry) {
                if (!shouldBe.has(entry)) {
                    differences.push({
                        type: "unwanted",
                        value: entry,
                        path: [...path, entry]
                    });
                }
            });
            return differences.length === 0
                ? true : differences;
        }
    };

    const assertEqualityLoose = function TK_DataTypesChecksEquality_assertEqualityLoose(
        path: any[], value: any, shouldBe: any,
        toleranceDepth: number, allowAdditions: boolean
    ): true | EqualityDifference[] {
        if (isIdentical(value, shouldBe)) {
            return true;
        } else if (
            typeof shouldBe === "function"
            && shouldBe.valueChecks instanceof Array
        ) {
            if (shouldBe(value) === true) {
                return true;
            } else {
                return [{ path, type: "invalid", value, shouldBe }];
            }
        } else if (toleranceDepth === 0) {
            return [{ path, type: "tooDeep", value, shouldBe }];
        }

        const simpleTestResult = isSimpleAndEqual(value, shouldBe, toleranceDepth);
        if (simpleTestResult === true) {
            return true;
        } else if (simpleTestResult !== false) {
            simpleTestResult.path = path;
            return [simpleTestResult];
        }

        toleranceDepth -= 1;
        if (value instanceof Set) {
            return differentiators.set(path, value, shouldBe);
        }

        let reader = readProperty.basic;
        if (shouldBe instanceof Map) {
            reader = readProperty.Map;
        } else if (shouldBe instanceof Set) {
            reader = readProperty.Set;
        }
        return equalLoop(
            path, value, shouldBe,
            toleranceDepth, allowAdditions,
            reader
        );
    };

    const equalLoop = function (
        path: any[], value: any, shouldBe: any,
        toleranceDepth: number, allowAdditions: boolean,
        reader: { (container: any, key: any): any }
    ) {
        const additionalKeys = new Set(getKeys(value));
        let differences = <EqualityDifference[]>[];
        let returned: true | EqualityDifference[];
        getKeys(shouldBe).forEach(function (key) {
            additionalKeys.delete(key);
            returned = assertEqualityLoose(
                path.concat(key), reader(value, key), reader(shouldBe, key),
                toleranceDepth, allowAdditions
            );
            if (returned !== true) {
                differences.push(...returned);
            }
        });
        if (additionalKeys.size !== 0 && allowAdditions === false) {
            additionalKeys.forEach(function (key) {
                returned = reader(value, key);
                if (returned !== undefined) {
                    differences.push({
                        path: path.concat(key),
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

    const isSimpleAndEqual = function TK_DataTypesChecksEquality_isSimpleAndEqual(
        value: any,
        shouldBe: any,
        toleranceDepth: number
    ): boolean | EqualityDifference {
        if (isSimpleAndDifferent(value, shouldBe)) {
            return <EqualityDifference>{ type: "different", value, shouldBe };
        }
        return false;
    };

    const readProperty = {
        basic: function (container: any, key: any) {
            return container[key];
        },
        Set: function (container: Set<any>, key: any) {
            return container.has(key) ? key : undefined;
        },
        Map: function (container: Map<any, any>, key: any) {
            return container.get(key);
        }
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "dataTypes", subSection: "checks", entries: publicExports });
    }
})();