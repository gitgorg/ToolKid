(function TK_nodeJSDirectory_test() {
    const paths = <T_pathList_test>require(ToolKid.nodeJS.resolvePath(__dirname,"./T_fileDirectory/T_pathList.test.js"));

    const { assertFailure, assertEquality, shouldPass, test } = ToolKid.debug.test;
    const { loopDirectory, readDirectory, resolvePath } = ToolKid.nodeJS;



    test({
        subject: readDirectory,
        execute: function basic() {
            assertEquality({
                "directory with mixed files1":{
                    value: readDirectory(paths.directoryMixedContents),
                    shouldBe: [
                        "T_empty","T_empty.txt","T_file.json","T_pathList.test.js"
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
        execute: function fail_readDirectory() {
            assertFailure({
                name: "file",
                execute: readDirectory,
                withInputs: paths.file,
                shouldThrow: ["TK_nodeJSDirectory_read - path is a file, not a directory:", resolvePath(paths.file)]
            });
        }
    });

    test({
        subject: loopDirectory,
        execute: function success_loopDirectory() {
            let list = <any[]>[];
            loopDirectory({
                path:paths.directoryMixedContents,
                execute: list.push.bind(list)
            });
            const isDirectoryStats = function (value:any) {
                if (Object.keys(value).length !== 4) {
                    return false;
                }
                const {name, root, path} = value;
                if (
                    typeof name !== "string"
                    || typeof root !== "string"
                    || typeof path !== "string"
                    || typeof value.isDirectory !== "boolean"
                ) {
                    return false;
                }
                return (
                    path.indexOf(root) === 0
                    && path.slice(-name.length) === name
                );
            };
            const checker = shouldPass(isDirectoryStats);
            assertEquality({
                "directory with mixed files2":{
                    value: list,
                    shouldBe: [
                        checker, checker, checker, checker
                    ],
                    toleranceDepth: 2
                }
            });
        }
    },{
        subject: loopDirectory,
        execute: function fail_loopDirectory() {
            assertFailure({
                name: "notADirectory",
                execute: readDirectory,
                withInputs: paths.file,
                shouldThrow: ["TK_nodeJSDirectory_read - path is a file, not a directory:", resolvePath(paths.file)]
            });
        }
    });
})();