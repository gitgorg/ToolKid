(function LibraryBuilder_test() {
    const { easyExpression, loopFiles } = <LibraryTools_file>require(ToolKid.nodeJS.resolvePath(__dirname,"./LibraryTools.js"));
    const { test, assertEquality } = ToolKid.debug.test;

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
        execute: function filteringPaths() {
            const filterPathsEasy = function LibraryTools_test_filterPathsEasy(
                easyString: string
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

    const Path = require("path");
    test({
        subject: loopFiles,
        execute: function basicFileLoop() {
            const fileDirectory = __dirname;
            let found = <string[]>[];
            loopFiles({
                path: fileDirectory,
                execute: found.push.bind(found)
            });
            assertEquality({
                "siblingFiles": {
                    value: found,
                    shouldBe: [
                        Path.resolve(fileDirectory, "Library.js"),
                        Path.resolve(fileDirectory, "LibraryTools.js"),
                        Path.resolve(fileDirectory, "LibraryTools.test.js")
                    ]
                }
            });
        }
    });
})();