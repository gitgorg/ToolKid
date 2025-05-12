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
    const { resolve } = require("path");
    const {
        isDirectory, readFile, resolvePath, writeFile
    } = <LibraryTools_file>require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryTools_nodeJS.js"));

    const paths = require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryFiles.test.js"));

    const { assertEquality, assertFailure, test } = ToolKid.debug.test;
    const { deleteFile } = ToolKid.nodeJS;



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
        subject: readFile,
        execute: function basic() {
            const fileResponse = <Dictionary>readFile({ path: paths.file });

            assertEquality({
                "regular file response": {
                    value: fileResponse,
                    shouldBe: {
                        encoding: "utf8",
                        content: fileResponse.content
                    }
                },
                "response.content parsed as JSON": {
                    value: JSON.parse(fileResponse.content),
                    shouldBe: {
                        "text": "hello",
                        "number": 1
                    }
                },
                "empty file response": {
                    value: readFile({ path: paths.fileEmpty }),
                    shouldBe: {
                        encoding: "utf8",
                        content: ""
                    }
                },
                "non-existing file response": {
                    value: readFile({ path: paths.fileNonExisting }),
                    shouldBe: { content: undefined }
                },
                "non-esisting directory response": {
                    value: readFile({ path: paths.directoryNonExisting }),
                    shouldBe: { content: undefined }
                }
            });
        }
    }, {
        subject: readFile,
        execute: function readDirectory() {
            assertFailure({
                name: "directory response",
                execute: readFile,
                withInputs: { path: paths.directoryMixedContents },
                shouldThrow: [
                    "LibraryTools_nodeJS_read - path is a directory, not a file:",
                    paths.directoryMixedContents
                ]
            });
        }
    });

    test({
        subject: resolvePath,
        execute: function basicResolvePath() {
            assertEquality({
                "__dirname": {
                    value: resolvePath(__dirname),
                    shouldBe: __dirname
                },
                "./test.js": {
                    value: resolvePath("./test.js"),
                    shouldBe: resolve("test.js")
                }
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