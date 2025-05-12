(function TK_nodeJSFile_test() {
    const { assertEquality, test } = ToolKid.debug.test;
    const { deleteFile, extendFile, readFile, writeFile } = ToolKid.nodeJS;



    test({
        subject: extendFile,
        execute: function regularFileExtension() {
            deleteFile("./TKTest.extendFile.txt");
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
        },
        callback: function () {
            test({
                subject: deleteFile,
                execute: function simpleUsage() {
                    deleteFile("./TKTest.extendFile.txt");
                }
            })
        }
    }, {
        subject: extendFile,
        execute: function newFileExtension() {
            deleteFile("./TKTest.extendFileNew.txt");
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
        },
        callback: function () {
            deleteFile("./TKTest.extendFileNew.txt");
        }
    }, {
        subject: extendFile,
        execute: function newFolderFileExtension() {
            deleteFile("./testFolder");
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
        },
        callback: function () {
            deleteFile("./testFolder");
        }
    });
})();