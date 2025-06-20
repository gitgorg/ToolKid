(function TK_nodeJSFile_test() {
    const paths = <LibraryFiles_test_file>require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryFiles.test.js"));
    const { assertEquality, assertFailure, test } = ToolKid.debug.test;
    const { deletePath, extendFile, isDirectory, readDirectory, readFile, writeFile } = ToolKid.nodeJS;



    test({
        subject: extendFile,
        execute: function regularFileExtension() {
            deletePath("./TKTest.extendFile.txt");
            assertEquality({
                "file not there yet": {
                    value: readFile("./TKTest.extendFile.txt"),
                    shouldBe: { content: undefined }
                }
            });
            writeFile({
                path: "./TKTest.extendFile.txt",
                content: "1"
            });
            assertEquality({
                "file ready": {
                    value: readFile({ path: "./TKTest.extendFile.txt" }),
                    shouldBe: {
                        encoding: "utf8",
                        content: "1"
                    }
                }
            });
            extendFile({
                path: "./TKTest.extendFile.txt",
                content: "2"
            });
            assertEquality({
                "file changed": {
                    value: readFile("./TKTest.extendFile.txt"),
                    shouldBe: {
                        encoding: "utf8",
                        content: "12"
                    }
                }
            });
        },
        callback: function () {
            test({
                subject: deletePath,
                execute: function simpleUsage() {
                    deletePath("./TKTest.extendFile.txt");
                }
            })
        }
    }, {
        subject: extendFile,
        execute: function newFileExtension() {
            deletePath("./TKTest.extendFileNew.txt");
            assertEquality({
                "file not there yet": {
                    value: readFile({ path: "./TKTest.extendFileNew.txt" }),
                    shouldBe: { content: undefined }
                }
            });
            extendFile({
                path: "./TKTest.extendFileNew.txt",
                content: "2"
            });
            assertEquality({
                "file changed": {
                    value: readFile("./TKTest.extendFileNew.txt"),
                    shouldBe: {
                        encoding: "utf8",
                        content: "2"
                    }
                }
            });
        },
        callback: function () {
            deletePath("./TKTest.extendFileNew.txt");
        }
    }, {
        subject: extendFile,
        execute: function newFolderFileExtension() {
            deletePath("./testFolder");
            assertEquality({
                "file not there yet": {
                    value: readFile({ path: "./testFolder/TKTest.extendFileFolder.txt" }),
                    shouldBe: { content: undefined }
                }
            });
            extendFile({
                path: "./testFolder/TKTest.extendFileFolder.txt",
                content: "3"
            });
            assertEquality({
                "file changed": {
                    value: readFile("./testFolder/TKTest.extendFileFolder.txt"),
                    shouldBe: {
                        encoding: "utf8",
                        content: "3"
                    }
                }
            });
        },
        callback: function () {
            deletePath("./testFolder");
        }
    });

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
        subject: readDirectory,
        execute: function readingFiles() {
            assertEquality({
                "directory": {
                    value: readDirectory(paths.directoryMixedContents),
                    shouldBe: ['T_empty', 'T_empty.txt', 'T_file.json']
                },
                "empty directory": {
                    value: readDirectory(paths.directoryEmpty),
                    shouldBe: []
                },
                "file": {
                    value: readDirectory(paths.file),
                    shouldBe: []
                },
                "non existing directory": {
                    value: readDirectory(paths.directoryNonExisting),
                    shouldBe: []
                },
                "non existing file": {
                    value: readDirectory(paths.fileNonExisting),
                    shouldBe: []
                }
            });
        }
    });
})();