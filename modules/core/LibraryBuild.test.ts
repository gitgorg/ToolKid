(function LibraryBuild_test() {
    const { assert, shouldPass, test } = ToolKid.debug.test;
    const {
        fileBundleSetup, fileBundlePush, fileBundleCombine
    } = <LibraryBuild_file>require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryBuild.js"));

    const shouldBeString = shouldPass(ToolKid.dataTypes.checks.isString);



    test({
        subject: fileBundleSetup,
        execute: function defaultSetup() {
            assert({
                "default setup": {
                    value: fileBundleSetup(),
                    shouldBe: {
                        header: shouldBeString,
                        fileContents: new Map(),
                        footer: shouldBeString,
                    },
                    toleranceDepth: 2,
                }
            });
        }
    });

    test({
        subject: fileBundlePush,
        execute: function defaultPush() {
            const bundleData = fileBundleSetup();
            fileBundlePush({
                bundleData,
                importID: "a",
                fileContent: "aaa",
                fileParser: false,
            });
            assert({
                "fileBundlePush returns": {
                    value: fileBundlePush({
                        bundleData,
                        importID: "b",
                        fileContent: "bbb",
                        fileParser: false,
                    }),
                    shouldBe: undefined,
                },
                "bundleData.fileContent": {
                    value: bundleData.fileContents,
                    shouldBe: new Map([["a", "aaa"], ["b", "bbb"]]),
                },
            });
        }
    });

    test({
        subject: fileBundleCombine,
        execute: function defaultCombine() {
            const bundleData = fileBundleSetup();
            fileBundlePush({ bundleData, importID: "a", fileContent: "aaa" });
            fileBundlePush({ bundleData, importID: "b", fileContent: "bbb" });
            assert({
                "simple order": {
                    value: fileBundleCombine(bundleData),
                    shouldBe: shouldBeString,
                }
            });
            fileBundlePush({ bundleData, importID: "a", fileContent: "a" });
            fileBundlePush({ bundleData, importID: "b", fileContent: "b" });
            assert({
                "overwritten order": {
                    value: fileBundleCombine(bundleData),
                    shouldBe: '\
"use strict";\n\
(function Library_bundledFiles_init() {\n\
const fileCollection = new Map();\n\
\n\
aaa\n\
fileCollection.set("a", module.exports);\n\
\n\
bbb\n\
fileCollection.set("b", module.exports);\n\
\n\
})();',
                }
            });
        }
    });
})();