(function TK_nodeJSPath_file_test() {
    const paths = <T_pathList_test>require("./T_fileDirectory/T_pathList.test.js");

    const { assertFailure, assertEquality, test } = ToolKid.debug.test;
    const { isDirectory, isUsedPath, resolvePath } = ToolKid.nodeJS;

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

    const Path = require("path");
    test({
        subject: resolvePath,
        execute: function basicResolvePath() {
            assertEquality({
                "__dirname":{
                    value: resolvePath(__dirname),
                    shouldBe: __dirname
                },
                "./test.js":{
                    value: resolvePath("./test.js"),
                    shouldBe: Path.resolve("test.js")
                }
            });
        }
    });
})();