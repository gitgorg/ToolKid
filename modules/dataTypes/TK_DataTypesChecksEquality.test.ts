(function TK_DataTypesChecksEquality_test() {
    const Debug = ToolKid.debug;
    const { test } = Debug.test;
    const { areEqual } = ToolKid.dataTypes.checks;



    const testError = new Error("test");

    test({
        subject: areEqual,
        assert: {
            "deep complex values": {
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
            },
            "different values": {
                value: areEqual({
                    value: {
                        different: 100,
                        exceeding: true
                    },
                    shouldBe: {
                        different: "100",
                        missing: true
                    }
                }),
                shouldBe: [
                    { path: ["different"], type: "different", value: 100, shouldBe: "100" },
                    { path: ["missing"], type: "different", value: undefined, shouldBe: true },
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
            },
            "Error & empty Object reverse order": {
                value: areEqual({}, testError),
                shouldBe: [
                    { path: [], type: "different", value: {}, shouldBe: testError }
                ],
                toleranceDepth: 3
            },
            "smaller map": {
                value: areEqual({
                    value: new Map([[1, "one"], [2, "two"]]),
                    shouldBe: new Map([[1, "one"], [2, "two"], [3, "three"]]),
                    toleranceDepth: 3
                }),
                shouldBe: [{ type: "different", value: undefined, shouldBe: "three", path: [3] }],
                toleranceDepth: 4
            },
            "bigger map": {
                value: areEqual({
                    value: new Map([[1, "one"], [2, "two"], [3, "three"]]),
                    shouldBe: new Map([[1, "one"], [2, "two"]]),
                    toleranceDepth: 3
                }),
                shouldBe: [{ type: "unwanted", value: "three", path: [3] }],
                toleranceDepth: 4
            },
            "map to object": {
                value: areEqual({
                    value: new Map([["value", true]]),
                    shouldBe: { value: true },
                    toleranceDepth: 3
                }),
                shouldBe: [{ type: "different", path: ["value"], shouldBe: true }],
                toleranceDepth: 4
            },
            "smaller set": {
                value: areEqual({
                    value: new Set([1, 2, 3]),
                    shouldBe: new Set([1, 2, 3, 4]),
                    toleranceDepth: 3
                }),
                shouldBe: [{ type: "different", value: undefined, shouldBe: 4, path: [4] }],
                toleranceDepth: 4
            },
            "bigger set": {
                value: areEqual({
                    value: new Set([1, 2, 3, 4]),
                    shouldBe: new Set([1, 2, 3]),
                    toleranceDepth: 3
                }),
                shouldBe: [{ type: "unwanted", value: 4, path: [4] }],
                toleranceDepth: 4
            },
            "depth 1 (default) - to deep": {
                value: areEqual({
                    value: [1, [2], [[3]]],
                    shouldBe: [1, [2], [[3]]]
                }),
                shouldBe: [
                    { path: [1], type: "tooDeep", value: [2], shouldBe: [2] },
                    { path: [2], type: "tooDeep", value: [[3]], shouldBe: [[3]] }
                ],
                toleranceDepth: 4
            },
            "depth 2 - too deep": {
                value: areEqual({
                    value: [1, [2], [[3]]],
                    shouldBe: [1, [2], [[3]]],
                    toleranceDepth: 2
                }),
                shouldBe: [
                    { path: [2, 0], type: "tooDeep", value: [3], shouldBe: [3] }
                ],
                toleranceDepth: 4
            },
            "depth 3 - just right": {
                value: areEqual({
                    value: [1, [2], [[3]]],
                    shouldBe: [1, [2], [[3]]],
                    toleranceDepth: 3
                }),
                shouldBe: true,
                toleranceDepth: 4
            },
            "depth 4 - more than needed": {
                value: areEqual({
                    value: [1, [2], [[3]]],
                    shouldBe: [1, [2], [[3]]],
                    toleranceDepth: 4
                }),
                shouldBe: true,
                toleranceDepth: 4
            },
        }
    });
})();