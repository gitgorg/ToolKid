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
        isDirectory, writeFile
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

    test({
        subject: writeFile,
        execute: function basic() {
            assertEquality({
                "file not there yet": {
                    value: readFile({ path: "./TKTest.txt" }),
                    shouldBe: { content: undefined }
                }
            });
            writeFile({
                path: "./TKTest.txt",
                content: "working"
            });
            assertEquality({
                "file ready": {
                    value: readFile({ path: "./TKTest.txt" }),
                    shouldBe: {
                        encoding: "utf8",
                        content: "working"
                    }
                }
            });
        },
        callback: function () {
            deleteFile("./TKTest.txt");
        }
    });
})();