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
            shouldBeAtLeast: ValueChecker | any,
            toleranceDepth?: number
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
        if (nameAndValue[1].shouldBeAtLeast === undefined) {
            assertEqualityRegular(...nameAndValue);
        } else {
            assertEqualityLoose(Object.assign(
                { name: nameAndValue[0], path: [] },
                nameAndValue[1]
            ));
        }
    };

    const fastResponse = function TK_DebugTestAssertion_fastResponse(path: any[], details: {
        value: any,
        shouldBe: any,
        toleranceDepth?: number
    }): boolean | [string, ...any[]] {
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
            const location = path.length === 0
                ? "value"
                : ["value", ...path].join(".");
            return [location + " is:", value, "but should be equal to:", shouldBe];
        } else if (details.toleranceDepth === 0) {
            return ["differences not tollerated between value:", value, " and :", shouldBe]
        }

        return false;
    };

    const assertEqualityRegular = function TK_DebugTestAssertion_assertEqualityRegular(
        name: string,
        details: {
            value: any,
            shouldBe: any,
            toleranceDepth?: number
        }
    ) {
        const response = fastResponse([], details);
        if (response === true) {
            return;
        } else if (response !== false) {
            throw report({
                name, message: response
            });
        }

        assertEqualityDeep({
            name,
            value: details.value,
            shouldBe: details.shouldBe,
            toleranceDepth: details.toleranceDepth || 1
        });
    };

    const assertEqualityDeep = function TK_DebugTestAssertion_assertEqualityDeep(inputs: {
        name: string,
        value: any,
        shouldBe: any,
        toleranceDepth: number
    }) {
        const difference = ToolKid.object.compareDeep(
            inputs.value,
            inputs.shouldBe
        );
        if (difference.count !== 0) {
            throw report({
                name: inputs.name,
                message: ["value is:", inputs.value, "but should be equal to:", inputs.shouldBe, "difference:", difference]
            });
        }
    };

    const assertEqualityLoose = function TK_DebugTestAssertion_assertEqualityLoose(inputs: {
        name: string,
        value: any,
        shouldBeAtLeast: any,
        toleranceDepth?: number
        path: any[]
    }) {
        const { value, shouldBeAtLeast } = inputs;
        let toleranceDepth = (inputs.toleranceDepth === undefined)
            ? 1 : inputs.toleranceDepth;
        const response = fastResponse(
            inputs.path,
            {
                value,
                shouldBe: shouldBeAtLeast,
                toleranceDepth
            }
        );
        if (response === true) {
            return;
        } else if (response !== false) {
            throw report({
                name: inputs.name, message: response
            });
        }

        toleranceDepth -= 1;
        Object.entries(shouldBeAtLeast).forEach(function (keyValue) {
            const key = keyValue[0];
            assertEqualityLoose(Object.assign(
                {},
                inputs, {
                path: inputs.path.concat(key),
                value: value[key],
                shouldBeAtLeast: keyValue[1],
                toleranceDepth
            }
            ));
        });
    };

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