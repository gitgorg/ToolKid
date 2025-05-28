//combining all ToolKid parts
type ToolKidBuild_file = {
    (inputs?: ToolKidConfig): void
}

declare const ToolKid: ToolKid_file

interface ToolKid_file extends Library {
    core: LibraryParsing_file & LibraryFiles_file
}

type ToolKidConfig = {
    rootToolKidFiles: string | string[],
    rootLibraryFiles: string,
    include: string[],
    exclude: string[],
    exportFile?: string,
    runTests?: false
}



(function ToolKidBuild_init() {
    const FS = require("fs");
    const Path = require("path");



    module.exports = <ToolKidBuild_file>function ToolKidBuild_executeBuild(config) {
        if (typeof ToolKid !== "undefined") {
            return;
        }

        if (config === undefined) {
            config = readConfig();
        }
        const library = (<LibraryCore_file>require(
            Path.resolve(config.rootLibraryFiles, "LibraryCore.js")
        )).createInstance();
        const coreModuleFiles = library.getCoreModule("files");
        library.registerFunctions({
            section: "core", functions: {
                ...library.getCoreModule("parsing"),
                ...coreModuleFiles
            }
        });

        (<Dictionary>global).ToolKid = library;
        const fileLocations = <{ [fileName: string]: string }>{};
        coreModuleFiles.loopFiles({
            path: config.rootToolKidFiles,
            includes: config.include,
            excludes: config.exclude,
            execute: registerExtensionFile.bind(null, fileLocations)
        });
        writeLibraryFile({
            library,
            exportFile: config.exportFile,
            fileLocations,
            libraryRoot: config.rootLibraryFiles
        });
        if (config.runTests !== false) {
            setTimeout(
                runTests.bind(null, config), 100
            );
        }
    };



    const combinedLibrarySetup = function (inputs: {
        library: Library, libraryRoot: string
    }) {
        const { libraryRoot } = inputs;
        const { readFile, resolvePath } = ToolKid.core;

        const template = readFile({
            path: resolvePath(libraryRoot, "../build/ToolKidTemplate.js"),
            checkExistance: false
        }).content;
        let result = "";
        let index = 0;
        const layers = Object.assign({
            importLibrary: {
                patterns: [
                    ["//#import:", /\n|$/],
                    ["/*#import:", "*/"]
                ]
            },
        }, ToolKid.core.getLayerDefinition());
        ToolKid.core.createTextParserLayered({
            layers,
            parser: function (RXResult, name, RXOpening) {
                if (name !== "importLibrary" || RXOpening === undefined) {
                    return;
                }

                result += template.slice(index, RXOpening.index);
                const path = RXResult.input.slice(RXOpening.index + RXOpening[0].length, RXResult.index);
                let file = readFile({
                    path: resolvePath(libraryRoot, path),
                    checkExistance: false
                });
                result += removeStrictMode(file.content) + "\n";
                index = RXResult.index + RXResult[0].length;
            }
        })(template);
        return result + template.slice(index, -6);
    };

    const removeStrictMode = function ToolKidBuild_removeStrictMode(fileContent: string) {
        const firstPosition = fileContent.indexOf("use strict") - 1;
        if (firstPosition !== -2 && firstPosition < 20) {
            return fileContent.slice(firstPosition + 13).trim();
        } else {
            return fileContent;
        }
    };

    const registerExtensionFile = function ToolKidBuild_registerExtensionFile(
        pathsByFileName: Dictionary,
        path: string
    ) {
        const alias = Path.basename(path);
        if (pathsByFileName[alias] !== undefined) {
            console.warn("duplicate file alias \"" + alias + "\" - second path is:", path, " and registered was:", pathsByFileName[alias]);
        }
        pathsByFileName[alias] = path;
        require(path);
    };

    const writeLibraryFile = function (inputs: {
        library: Library,
        libraryRoot: string,
        fileLocations: Dictionary,
        exportFile?: string,
    }) {
        const privateData = {
            combinedFile: combinedLibrarySetup(inputs),
            registeredFiles: inputs.fileLocations,
            importedFiles: new Set(["LibraryCore.js"])
        };

        Object.entries(inputs.fileLocations).forEach(
            appendFile.bind(null, privateData)
        );

        // TODO: making a more stable and less ugly version for including
        const { writeFile } = inputs.library.getCoreModule("files");

        privateData.combinedFile += "global.log = ToolKid.debug.terminal.logImportant;\n";
        privateData.combinedFile += "module.exports = ToolKid;\n";
        privateData.combinedFile += "})();";
        writeFile({
            path: inputs.exportFile || (__dirname.slice(0, -5) + "ToolKid.js"),
            content: privateData.combinedFile
        });
    };

    const appendFile = function (
        privateData: Dictionary,
        aliasAndPath: [alias: string, path: string]
    ) {
        const [aliasOfFile, filePath] = aliasAndPath;
        if (privateData.importedFiles.has(aliasOfFile)) {
            return;
        }

        const analysed = analyseFile(filePath, function (position, fileName) {
            const aliasOfDependency = Path.basename(fileName);
            if (!privateData.importedFiles.has(aliasOfDependency)) {
                const dependencyPath = privateData.registeredFiles[aliasOfDependency];
                appendFile(privateData, [aliasOfDependency, dependencyPath]);
            }
        });

        privateData.combinedFile += analysed.contentReworked;
        privateData.combinedFile += "registeredFiles[\"" + aliasOfFile + "\"] = module.exports;\n\n";
        privateData.importedFiles.add(aliasOfFile);
        return require(filePath);
    };

    const regExpUseSctrict = /^\s*"use strict"/;

    const analyseFile = function ToolKidBuild_analyseFile(
        path: string, parser: GenericFunction
    ) {
        let { content } = ToolKid.core.readFile({ path });
        let contentClean = content.replace(regExpUseSctrict, "");

        let contentReworked = "";
        let position = 0;
        ToolKid.code.readJSImports({
            code: contentClean,
            parser: function (position, fileName) {
                parser(position, fileName);
                contentReworked += contentClean.slice(position, position);
                contentReworked += "registeredFiles[\"" + Path.basename(fileName) + "\"]";
                position = position + fileName.length + 11;
            }
        });
        contentReworked += contentClean.slice(position);
        return {
            path,
            contentReworked
        };
    };

    const readConfig = function ToolKidBuild_readConfig() {
        let result = <ToolKidConfig>{
            rootToolKidFiles: "../ToolKidFiles",
            rootLibraryFiles: "../LibraryFiles",
            include: ["*.js"],
            exclude: ["*.test.js"]
        };
        if (FS.existsSync("./ToolKidConfig.json")) {
            let content = FS.readFileSync("./ToolKidConfig.json", "utf8");
            result = JSON.parse(content);
        }
        return result;
    };

    const prepareInputsFullTest = function ToolKidBuild_prepareInputsFullTest(
        config: ToolKidConfig
    ) {
        return {
            title: "ToolKid",
            path: (typeof config.rootToolKidFiles === "string")
                ? [config.rootToolKidFiles, config.rootLibraryFiles]
                : [...config.rootToolKidFiles, config.rootLibraryFiles],
            include: ["*.test.js"],
            exclude: config.exclude.slice(1),
            suspects: [ToolKid],
        }
    };

    const runTests = function ToolKidBuild_runTests(
        config: ToolKidConfig
    ) {
        console.log(">> testing ToolKid");
        ToolKid.debug.test.testFull(
            prepareInputsFullTest(config)
        );
    };



    Object.freeze(module.exports);

    const executionFile = Path.basename(process.argv[1]);
    const isExecutedViaTerminal = executionFile.slice(0, 12) === "ToolKidBuild";
    if (isExecutedViaTerminal) {
        module.exports();
    }
})();