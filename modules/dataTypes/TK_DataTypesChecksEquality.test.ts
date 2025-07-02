(function TK_DataTypesChecksEquality_test() {
    const Debug = ToolKid.debug;
    const { assertEquality, test } = Debug.test;
    const { areEqual } = ToolKid.dataTypes.checks;



    test({
        subject: areEqual,
        execute: function passingTest() {
            assertEquality({
                "complexValues": {
                    value: areEqual({
                        value: {
                            NaN: NaN,
                            object: { number: 100 },
                            array: [1, 2, 3],
                            map: new Map(<any>[["text", "bla"], [10, 100]]),
                            set: new Set([1, true, "text"])
                        },
                        shouldBe: {
                            NaN: NaN,
                            object: { number: 100 },
                            array: [1, 2, 3],
                            map: new Map(<any>[["text", "bla"], [10, 100]]),
                            set: new Set([1, true, "text"])
                        },
                        toleranceDepth: 3
                    }),
                    shouldBe: true
                }
            });
        }
    }, {
        subject: areEqual,
        execute: function failure_differentValues() {
            const differences = areEqual({
                value: {
                    different: 100,
                    exceeding: true
                },
                shouldBe: {
                    different: "100",
                    missing: true
                }
            });
            const testError = new Error("test");
            assertEquality({
                "differentValues": {
                    value: differences,
                    shouldBe: [
                        { path: ["different"], type: "tooDeep", value: 100, shouldBe: "100" },
                        { path: ["missing"], type: "tooDeep", value: undefined, shouldBe: true },
                        { path: ["exceeding"], type: "unwanted", value: true }
                    ],
                    toleranceDepth: 4
                },
                "Error & empty Object": {
                    value: areEqual(testError, {}),
                    shouldBe: [
                        { path: [], type: "different", value: testError, shouldBe: {} }
                    ],
                    toleranceDepth: 3
                }
            });

            assertEquality({
                "too small set": {
                    value: areEqual({
                        value: new Set([1, 2, 3]),
                        shouldBe: new Set([1, 2, 3, 4]),
                        toleranceDepth: 3
                    }),
                    shouldBe: [{ type: "different", value: undefined, shouldBe: 4, path: [4] }],
                    toleranceDepth: 4
                },
                "too big set": {
                    value: areEqual({
                        value: new Set([1, 2, 3, 4]),
                        shouldBe: new Set([1, 2, 3]),
                        toleranceDepth: 3
                    }),
                    shouldBe: [{type:"unwanted", value:4, path:[4]}],
                    toleranceDepth: 4
                }
            });
        }
    }, {
        subject: areEqual,
        execute: function exceedingToleranceDepth() {
            let differences = areEqual({
                value: [1, [2], [[3]]],
                shouldBe: [1, [2], [[3]]]
            });
            assertEquality({
                "depthDefault(1)": {
                    value: differences,
                    shouldBe: [
                        { path: [1], type: "tooDeep", value: [2], shouldBe:[2] },
                        { path: [2], type: "tooDeep", value: [[3]], shouldBe:[[3]] }
                    ],
                    toleranceDepth: 4
                }
            });
            differences = areEqual({
                value: [1, [2], [[3]]],
                shouldBe: [1, [2], [[3]]],
                toleranceDepth: 2
            });
            assertEquality({
                "depth2": {
                    value: differences,
                    shouldBe: [
                        { path: [2, 0], type: "tooDeep", value: [3], shouldBe: [3] }
                    ],
                    toleranceDepth: 4
                }
            });
        }
    });
})();