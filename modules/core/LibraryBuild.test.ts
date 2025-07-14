(function LibraryBuild_test() {
    const { assert, test } = ToolKid.debug.test;
    const {
        fileBundlePush, fileBundleCombine
    } = <LibraryBuild_file>require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryBuild.js"));



    test({
        subject: fileBundlePush,
        execute: function defaultPush() {
            const fileContents = new Map();
            fileBundlePush({
                fileContents,
                importID: "a",
                fileContent: "aaa",
            });
            assert({
                "fileBundlePush returns": {
                    value: fileBundlePush({
                        fileContents,
                        importID: "b",
                        fileContent: "bbb",
                    }),
                    shouldBe: undefined,
                },
                "bundleData.fileContent": {
                    value: fileContents,
                    shouldBe: new Map([["a", "aaa"], ["b", "bbb"]]),
                },
            });
        }
    });

    test({
        subject: fileBundleCombine,
        execute: function defaultCombine() {
            const fileContents = new Map();
            fileBundlePush({ fileContents, importID: "a", fileContent: "aaa\n" });
            fileBundlePush({ fileContents, importID: "b", fileContent: "bbb\n" });
            fileBundlePush({ fileContents, importID: "a", fileContent: "a\n" });
            assert({
                "overwrites don't apply": {
                    value: fileBundleCombine({ fileContents }),
                    shouldBe: '\
"use strict";\n\
(function Library_bundledFiles_init() {\n\
const fileCollection = new Map();\n\
\n\
aaa\n\
bbb\n\
})();',
                }
            });
        }
    });
})();