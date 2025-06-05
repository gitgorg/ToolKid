(function TK_DataTypesObject_test() {
    const { test, assertEquality } = ToolKid.debug.test;
    const { merge } = ToolKid.dataTypes.object;



    test({
        subject: merge,
        execute: function simpleCombinations() {
            assertEquality({
                "add": {
                    value: merge({ a: 1 }, { b: 2 }),
                    shouldBe: { a: 1, b: 2 }
                },
                "overwrite": {
                    value: merge({ a: 1 }, { a: 2 }),
                    shouldBe: { a: 2 }
                },
                "delete": {
                    value: merge({ a: 1 }, { a: undefined }),
                    shouldBe: {}
                }
            });
        }
    }, {
        subject: merge,
        execute: function complexCombinations() {
            assertEquality({
                "multiple objects": {
                    toleranceDepth: 4,
                    value: merge(
                        {
                            name: "sigi", lastName: "evers",
                            child: { name: "eva", lastName: "evers" }
                        },
                        { job: "janitor", history: ["janitor"] },
                        { job: undefined, history: ["janitor", undefined] },
                        { child: { name: "udo" } }
                    ),
                    shouldBe: {
                        name: "sigi", lastName: "evers",
                        history: ["janitor", undefined],
                        child: { name: "udo", lastName: "evers" }
                    }
                },
            });
        }
    });
})();