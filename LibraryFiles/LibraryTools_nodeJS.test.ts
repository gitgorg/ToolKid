type LibraryTools_nodeJS_test_file = {
    directoryMixedContents: string,
    directoryEmpty: string,
    directoryNonExisting: string,

    file: string,
    fileEmpty: string,
    fileNonExisting: string,
    fileTypeScript: string
}



(function LibraryTools_nodeJS_test() {
    const {
        isDirectory
    } = <LibraryTools_file>require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryTools_nodeJS.js"));

    const paths = require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryFiles.test.js"));

    const { assertEquality, assertFailure, test } = ToolKid.debug.test;
    const { deleteFile } = ToolKid.nodeJS;
    const { readFile } = ToolKid.core;



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