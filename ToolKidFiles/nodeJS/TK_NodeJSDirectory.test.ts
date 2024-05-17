(function TK_nodeJSDirectory_test() {
    const paths = <T_pathList_file>require("./T_fileDirectory/T_pathList");

    const { assertFailure, assertEquality, test } = ToolKid.debug.test;
    const { readDirectory, resolvePath } = ToolKid.nodeJS;



    test({
        subject: readDirectory,
        execute: function basic() {
            assertEquality({
                "directory with mixed files":{
                    value: readDirectory(paths.directoryMixedContents),
                    shouldBe: [
                        "T_empty","T_empty.txt","T_file.json","T_pathList.ts"
                    ]
                },
                "empty directory":{
                    value: readDirectory(paths.directoryEmpty),
                    shouldBe: []
                },
                "non-existing directory":{
                    value: readDirectory(paths.directoryNonExisting),
                    shouldBe: []
                },
                "non-existing file":{
                    value: readDirectory(paths.fileNonExisting),
                    shouldBe: []
                }
            });
        }
    }, {
        subject: readDirectory,
        execute: function crashes() {
            assertFailure({
                name: "file",
                execute: readDirectory,
                withInputs: paths.file,
                shouldThrow: ["TK_nodeJSDirectory_read - path is a file, not a directory:", resolvePath(paths.file)]
            });
        }
    });
})();