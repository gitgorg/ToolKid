(function TK_nodeJSPath_test() {
    const paths = require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryFiles.test.js"));

    const { assertEquality, assertFailure, test } = ToolKid.debug.test;
    const { isDirectory } = ToolKid.nodeJS;



    test({
        subject: isDirectory,
        execute: function basic() {
            assertEquality({
                "directory": {
                    value: isDirectory(paths.directoryMixedContents),
                    shouldBe: true
                },
                "empty directory": {
                    value: isDirectory(paths.directoryEmpty),
                    shouldBe: true
                },
                "file": {
                    value: isDirectory(paths.file),
                    shouldBe: false
                }
            });
        }
    }, {
        subject: isDirectory,
        execute: function crashes() {
            assertFailure({
                name: "'nonExistant' returns",
                execute: isDirectory,
                withInputs: "nonExistant",
                shouldThrow: Error
            });
        }
    });
})();