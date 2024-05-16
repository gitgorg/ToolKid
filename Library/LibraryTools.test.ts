(function LibraryBuilder_test () {
    const {easyExpression} = <LibraryTools_file>require("./LibraryTools.js");
    const {test, assertEquality} = ToolKid.debug.test;

    const paths = [
        "a/b/c.ts",
        "a/b/c.js",
        "a/b/c.test.js",
        "a/b/c/d",
        "a/d/c.ts",
        "a/b"
    ];

    test({
        subject: easyExpression,
        execute: function basic () {
            const filterPathsEasy = function LibraryTools_test_filterPathsEasy (
                easyString:string
            ) {
                const expression = easyExpression(easyString);
                return paths.filter(
                    expression.test.bind(expression)
                );
            };

            assertEquality({
                "tests": {
                    value: filterPathsEasy("*.test.js"),
                    shouldBe: [
                        "a/b/c.test.js"
                    ]
                },
                "has subname starting with c": {
                    value: filterPathsEasy("*/c*"),
                    shouldBe: [
                        "a/b/c.ts",
                        "a/b/c.js",
                        "a/b/c.test.js",
                        "a/b/c/d",
                        "a/d/c.ts"
                    ]
                },
                "has folder": {
                    value: filterPathsEasy("*/d/*"),
                    shouldBe: [
                        "a/d/c.ts"
                    ]
                },
                "ends with folder": {
                    value: filterPathsEasy("*/b"),
                    shouldBe: [
                        "a/b"
                    ]
                }
            });
        }
    });
})();