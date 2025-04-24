(function TK_nodeJSFile_test() {
    const paths = <T_pathList_test>require(ToolKid.nodeJS.resolvePath(__dirname,"./T_fileDirectory/T_pathList.test.js"));

    const { assertFailure, assertEquality, test } = ToolKid.debug.test;
    const { deleteFile, extendFile, readFile, resolvePath, writeFile } = ToolKid.nodeJS;



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
                    shouldBe: undefined
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
            deleteFile( "./TKTest.extendFile.txt");
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
                    shouldBe: undefined
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
            deleteFile( "./TKTest.extendFileNew.txt");
        }
    }, {
        subject: readFile,
        execute: function basic() {
            const fileResponse = <Dictionary>readFile({ path: paths.file });

            assertEquality({
                "regular file response":{
                    value: fileResponse,
                    shouldBe: {
                        encoding: "utf8",
                        content: fileResponse.content
                    }
                },
                "response.content parsed as JSON":{
                    value: JSON.parse(fileResponse.content),
                    shouldBe: {
                        "text": "hello",
                        "number": 1
                    }
                },
                "empty file response":{
                    value: readFile({ path: paths.fileEmpty }),
                    shouldBe: {
                        encoding: "utf8",
                        content: ""
                    }
                },
                "non-existing file response":{
                    value: readFile({ path: paths.fileNonExisting }),
                    shouldBe: undefined
                },
                "non-esisting directory response":{
                    value: readFile({ path: paths.directoryNonExisting }),
                    shouldBe: undefined
                }
            });
        }
    }, {
        subject: readFile,
        execute: function crashes() {
            assertFailure({
                name: "directory response",
                execute: readFile,
                withInputs: { path: paths.directoryMixedContents },
                shouldThrow: [
                    "TK_nodeJSFile_read - path is a directory, not a file:",
                    resolvePath(paths.directoryMixedContents)
                ]
            });
        }
    });
})();