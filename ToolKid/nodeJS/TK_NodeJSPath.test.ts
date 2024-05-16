(function TK_nodeJSPath_file_test() {
    const FS = require("fs");
    const paths = <T_pathList_file>require("./T_fileDirectory/T_pathList");

    const { assertFailure, assertEquality, test } = ToolKid.debug.test;
    const { isDirectory, isUsedPath } = ToolKid.nodeJS;

    //create empty directory if not there (because you can't read those from git)
    if (!FS.existsSync(paths.directoryEmpty)) {
        FS.mkdirSync(paths.directoryEmpty);
    }

    test({
        subject: isDirectory,
        execute: function basic() {
            assertEquality({
                "directory":{
                    value: isDirectory(paths.directoryMixedContents),
                    shouldBe: true
                },
                "empty directory":{
                    value: isDirectory(paths.directoryEmpty),
                    shouldBe: true
                },
                "file":{
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
        subject: isUsedPath,
        execute: function basic() {
            assertEquality({
                "file":{
                    value: isUsedPath(paths.file),
                    shouldBe: true
                },
                "directory":{
                    value: isUsedPath(paths.directoryMixedContents),
                    shouldBe: true
                },
                "non-existing file":{
                    value: isUsedPath(paths.fileNonExisting),
                    shouldBe: false
                },
                "non-existing directory":{
                    value: isUsedPath(paths.directoryNonExisting),
                    shouldBe: false
                }
            });
        }
    });
})();