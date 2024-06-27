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
    }): void,
    shouldPass(
        checker: (value: any) => boolean
    ): ValueChecker
}

type ValueChecker = (
    value: any
) => boolean



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
        const settings = Object.assign({},nameAndValue[1]);
        if (typeof settings.toleranceDepth !== "number") {
            settings.toleranceDepth = 1;
        }
        assertEqualityLoose(Object.assign(
            { name: nameAndValue[0], path: [] },
            settings
        ));
    };

    const isEqualShallow = function TK_DebugTestAssertion_isEqualShallow(
        path: any[],
        details: {
            value: any,
            shouldBe: any,
            toleranceDepth: number
        }
    ): boolean | [string, ...any[]] {
        const { value, shouldBe } = details;
        if (isIdentical(value, shouldBe)) {
            return true;
        }

        if (typeof shouldBe === "function" && shouldBe.isValueChecker === true) {
            if (shouldBe(value) === true) {
                return true;
            } else {
                return ["value:", value, " didnt pass check:", shouldBe];
            }
        }

        if (isDifferentAndSimple(value, shouldBe)) {
            return [buildPathName(path) + " is:", value, "but should be equal to:", shouldBe];
        } else if (details.toleranceDepth === 0) {
            return [buildPathName(path) + " exceeds tolerance depth:", value]
        }

        return false;
    };

    const buildPathName = function (path:any[]) {
        if (path.length === 0) {
            return "value";
        }

        let result = "value";
        path.forEach(function (part) {
            if (typeof part === "function") {
                result += ".>>function:" + part.name+"<<";
            } else {
                result += "." + part;
            }
        });
        return result;
    };

    const assertEqualityLoose = function TK_DebugTestAssertion_assertEqualityLoose(inputs: {
        name: string,
        value: any,
        shouldBe: any,
        toleranceDepth: number,
        path: any[],
        allowAdditions?: true
    }) {
        const { value, shouldBe } = inputs;
        const message = isEqualShallow(
            inputs.path,
            {
                value,
                shouldBe,
                toleranceDepth: inputs.toleranceDepth
            }
        );
        if (message === true) {
            return;
        } else if (message !== false) {
            throw report({
                name: inputs.name, message
            });
        }

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
                value: reader(value,key),
                shouldBe: reader(shouldBe,key),
                toleranceDepth,
                allowAdditions: inputs.allowAdditions
            }
            ));
        });
        if (additionalKeys.size !== 0 && inputs.allowAdditions !== true) {
            throw [buildPathName(inputs.path) + " has unwanted properties:", additionalKeys];
        }
    };

    const getKeys = function TK_DebugTestAssertion_getKeys (value:any) {
        if (value instanceof Map) {
            return Array.from(value.keys());
        } else if (value instanceof Set) {
            return Array.from(value);
        } else {
            return Object.keys(value);
        }
    };

    const readProperty = {
        basic: function (container:any, key:any) {
            return container[key];
        },
        Set: function (container:Set<any>, key:any) {
            return container.has(key);
        },
        Map: function (
            container: Map<any,any>,
            key:any
        ) {
            return container.get(key);
        }
    }

    const isDifferentAndSimple = function TK_DebugTestAssertion_isDifferentAndSimple(
        valueA: any, valueB: any
    ) {
        return typeof valueA !== typeof valueB
            || !isList(valueA) || !isList(valueB);
    };

    const isIdentical = function TK_DebugTestAssertion_isIdentical(
        valueA: any, valueB: any
    ) {
        return valueA === valueB
            || (Number.isNaN(valueB) && Number.isNaN(valueA));
    };

    const isList = function TK_DebugTestAssertion_isList(value: any) {
        return typeof value === "object" && value !== null || typeof value === "function";
    };

    const report = function TK_DebugTestAssertion_report(inputs: {
        name: string,
        message: [string, ...any[]]
    }) {
        const { message } = inputs;
        return [
            "~ " + inputs.name + " ~ " + message[0],
            ...message.slice(1)
        ];
    };

    publicExports.shouldPass = function TK_DebugTestAssertion_shouldPass (checker) {
        const copy = checker.bind(null);
        copy.isValueChecker = true;
        return copy;
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();