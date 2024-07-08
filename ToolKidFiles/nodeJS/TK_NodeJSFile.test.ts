(function TK_nodeJSFile_test() {
    const paths = <T_pathList_test>require("./T_fileDirectory/T_pathList.test.js");

    const { assertFailure, assertEquality, test } = ToolKid.debug.test;
    const { readFile, resolvePath } = ToolKid.nodeJS;



    test({
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