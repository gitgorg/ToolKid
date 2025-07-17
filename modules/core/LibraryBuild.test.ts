(function LibraryBuild_test() {
    const { assert, test } = ToolKid.debug.test;
    const {
        fileBundleCombine
    } = <LibraryBuild_file>require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryBuild.js"));



    test({
        subject: fileBundleCombine,
        execute: function defaultCombine() {
            const fileContents = new Map([["a", "aaa\n"], ["b", "bbb\n"]]);
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