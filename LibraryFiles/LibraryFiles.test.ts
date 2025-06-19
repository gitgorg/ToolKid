type LibraryFiles_test_file = {
    directoryMixedContents: string,
    directoryEmpty: string,
    directoryNonExisting: string,

    file: string,
    fileEmpty: string,
    fileNonExisting: string,
    fileTypeScript: string
}



(function LibraryFiles_test() {
    const {
        createSimpleRX, createStringChecker, loopFiles, readFile, resolvePath, writeFile,
    } = <LibraryFiles_file>require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryFiles.js"));

    const FS = require("fs");
    const { resolve } = require("path");
    const { assertEquality, assertFailure, test } = ToolKid.debug.test;



    const testFolder = resolve(__dirname, "../T_fileDirectory/");
    const paths = module.exports = <LibraryFiles_test_file>{
        directoryMixedContents: testFolder,
        directoryEmpty: resolve(testFolder, "T_empty"),
        directoryNonExisting: resolve(testFolder, "../T_nonExistant"),

        file: resolve(testFolder, "T_file.json"),
        fileEmpty: resolve(testFolder, "T_empty.txt"),
        fileNonExisting: resolve(testFolder, "T_nonExistant.json"),
        fileTypeScript: resolve(testFolder, "T_pathList.test.js"),
    };

    if (!FS.existsSync(paths.directoryMixedContents)) {
        FS.mkdirSync(paths.directoryMixedContents);
    }
    if (!FS.existsSync(paths.directoryEmpty)) {
        FS.mkdirSync(paths.directoryEmpty);
    }
    FS.writeFileSync(paths.fileEmpty, "");
    FS.writeFileSync(paths.file, "{\
        \"text\": \"hello\",\
        \"number\": 1\
    }");



    test({
        subject: createSimpleRX,
        execute: function differentUsecases() {
            const testFiles = createSimpleRX({
                pattern: "*.test.js",
                isFromStartToEnd: true
            });
            const greedy = <any>createSimpleRX("**b**d");
            assertEquality({
                "testFiles": {
                    value: [testFiles.test("a.test.js"), testFiles.test("b.js"), testFiles.test("c.test.jsm")],
                    shouldBe: [true, false, false]
                },
                "greedy": {
                    value: [
                        greedy.exec("aaabcccd")[0],
                        greedy.exec("abcd")[0],
                        greedy.exec("aaabbbcccddd")[0],
                        greedy.exec("abcdb")[0],
                        greedy.exec("abcdbd")[0],
                    ],
                    shouldBe: ["aaabcccd", "abcd", "aaabbbcccddd", "abcd", "abcdbd"]
                },
            });

            const sourceContent = <any>createSimpleRX('src="(*)"');
            let found = sourceContent.exec('<img src="a.jpg" alt="a">');
            assertEquality({
                "sourceContent": {
                    value: [found[0], found[1]],
                    shouldBe: ['src="a.jpg"', "a.jpg"]
                },
            });
        }
    });

    test({
        subject: createStringChecker,
        execute: function checkingStrings() {
            const hasA = createStringChecker({ includes: [/a/] });
            assertEquality({
                "typeof hasA": {
                    value: typeof hasA, shouldBe: "function"
                },
                "hasA": {
                    value: [hasA("bcde"), hasA("bcade"), hasA("AAA")],
                    shouldBe: [false, true, false]
                }
            });
            const noBorC = createStringChecker({ excludes: [/b/, /c/] });
            assertEquality({
                "noBorC": {
                    value: [noBorC("bbbb"), noBorC("ccccc"), noBorC("BC")],
                    shouldBe: [false, false, true]
                }
            });
        }
    })

    test({
        subject: loopFiles,
        execute: function basicFileLoop() {
            const fileDirectory = __dirname;
            let found = <string[]>[];
            loopFiles({
                path: fileDirectory,
                execute: found.push.bind(found)
            });
            assertEquality({
                "siblingFiles": {
                    value: found,
                    shouldBe: [
                        resolve(fileDirectory, "LibraryBuild.js"),
                        resolve(fileDirectory, "LibraryCore.js"),
                        resolve(fileDirectory, "LibraryFiles.js"),
                        resolve(fileDirectory, "LibraryFiles.test.js"),
                        resolve(fileDirectory, "LibraryParsing.js"),
                        resolve(fileDirectory, "LibraryParsing.test.js"),
                    ]
                }
            });
        }
    });

    test({
        subject: loopFiles,
        execute: function loopingDirectory() {
            let fileList = <any[]>[];
            loopFiles({
                path: paths.directoryMixedContents,
                execute: fileList.push.bind(fileList)
            });
            assertEquality({
                "fileList": {
                    value: fileList,
                    shouldBe: [
                        paths.fileEmpty, paths.file
                    ],
                    toleranceDepth: 2
                }
            });
        }
    }, {
        subject: loopFiles,
        execute: function loopingFiles() {
            let fileList = <any[]>[];
            loopFiles({
                path: paths.file,
                execute: fileList.push.bind(fileList)
            });
            assertEquality({
                "fileList": {
                    value: fileList,
                    shouldBe: [
                        paths.file
                    ],
                    toleranceDepth: 2
                }
            });
        }
    });

    test({
        subject: readFile,
        execute: function basic() {
            const fileResponse = <Dictionary>readFile(paths.file);

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
                    value: readFile(paths.fileNonExisting),
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
                    "LibraryFiles_readFile - path is a directory, not a file:",
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
                    value: readFile("./TKTest.txt"),
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
            ToolKid.nodeJS.deleteFile("./TKTest.txt");
        }
    });



    Object.freeze(module.exports);
})();