(function TK_nodeJSFile_test() {
    const { assertEquality, test } = ToolKid.debug.test;
    const { deleteFile, extendFile, readFile, writeFile } = ToolKid.nodeJS;



    test({
        subject: extendFile,
        execute: function regularFileExtension() {
            deleteFile({
                path: "./TKTest.extendFile.txt",
                ignoreMissingFile: true
            });
            assertEquality({
                "file not there yet": {
                    value: readFile({ path: "./TKTest.extendFile.txt" }),
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
                    value: readFile({ path: "./TKTest.extendFile.txt" }),
                    shouldBe: {
                        encoding: "utf8",
                        content: "12"
                    }
                }
            });
            deleteFile("./TKTest.extendFile.txt");
        }
    }, {
        subject: extendFile,
        execute: function newFileExtension() {
            deleteFile({
                path: "./TKTest.extendFileNew.txt",
                ignoreMissingFile: true
            });
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
                    value: readFile({ path: "./TKTest.extendFileNew.txt" }),
                    shouldBe: {
                        encoding: "utf8",
                        content: "2"
                    }
                }
            });
            deleteFile("./TKTest.extendFileNew.txt");
        }
    }, {
        subject: extendFile,
        execute: function newFolderFileExtension() {
            deleteFile({
                path: "./testFolder",
                ignoreMissingFile: true
            });
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
                    value: readFile({ path: "./testFolder/TKTest.extendFileFolder.txt" }),
                    shouldBe: {
                        encoding: "utf8",
                        content: "3"
                    }
                }
            });
            deleteFile("./testFolder");
        }
    });
})();