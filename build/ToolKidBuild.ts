//combining all ToolKid parts
type ToolKidBuild_file = {
    (inputs?: ToolKidConfig): void
}

declare const ToolKid: ToolKid_file

interface ToolKid_file extends Library {
    core: LibraryParsing_file
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
    let LibraryTools: LibraryTools_file;



    module.exports = <ToolKidBuild_file>function ToolKidBuild_executeBuild(config) {
        if (typeof ToolKid !== "undefined") {
            return;
        }

        if (config === undefined) {
            config = readConfig();
        }
        const LibraryCore = <LibraryCore_file>require(Path.resolve(config.rootLibraryFiles, "LibraryCore.js"));
        const library = (<Dictionary>global).ToolKid = <ToolKid_file>LibraryCore.createInstance();
        library.registerFunctions({ section: "core", functions: LibraryCore.getExtension("parsing") });
        LibraryTools = LibraryCore.getTools();
        addCoreFunctions({
            library,
            distribution: {
                "isArray": ["dataTypes", "checks"],
                "isDirectory": ["nodeJS"],
                "loopFiles": ["nodeJS"],
                "readFile": ["nodeJS"],
                "resolvePath": ["nodeJS"],
                "writeFile": ["nodeJS"],
            }
        });
        const pathsByFileName = findIncludedFiles(config);
        writeLibraryFile({
            exportFile: config.exportFile,
            fileLocations: pathsByFileName,
            libraryRoot: config.rootLibraryFiles
        });
        if (config.runTests !== false) {
            setTimeout(
                runTests.bind(null, config), 100
            );
        }
    };



    const addCoreFunctions = function ToolKidBuild_addCoreFunctions(inputs: {
        library: Library,
        distribution: {
            [functionName: string]: [module: string, submodule?: string]
        }
    }) {
        const { library } = inputs;
        Object.entries(inputs.distribution).forEach(function ([key, sections]) {
            const functions = <Dictionary>{};
            functions[key] = LibraryTools[<"isArray">key];
            library.registerFunctions({
                section: sections[0], subSection: sections[1],
                functions
            });
        });
    };

    const combinedLibrarySetup = function (libraryPath: string) {
        let combinedLibraryContent = "\"use strict\";\n";
        combinedLibraryContent += "(function ToolKid_init () {\n";
        combinedLibraryContent += "const registeredFiles = {};\n\n\n";
        combinedLibraryContent += LibraryTools.readFile({ path: libraryPath }).content.slice(14, -7);
        combinedLibraryContent += "\n    global.ToolKid = publicExports.createInstance();";
        combinedLibraryContent += "\n})();\n";
        combinedLibraryContent += "registeredFiles[\"LibraryCore.js\"] = module.exports;\n\n";
        return combinedLibraryContent;
    };

    const findIncludedFiles = function ToolKidBuild_findIncludedFiles(config: ToolKidConfig) {
        const pathsByFileName = <{ [alias: string]: string }>{};
        LibraryTools.loopFiles({
            path: config.rootToolKidFiles,
            include: config.include,
            exclude: config.exclude,
            execute: LibraryTools.partial(registerExtendedFile, pathsByFileName)
        });
        return pathsByFileName;
    };

    const registerExtendedFile = function ToolKidBuild_registerExtendedFile(
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
        libraryRoot: string,
        fileLocations: Dictionary,
        exportFile?: string,
    }) {
        const { libraryRoot } = inputs;
        const { resolvePath } = LibraryTools;
        const libraryPath = resolvePath(libraryRoot) + "/LibraryCore.js";

        const privateData = {
            combinedFile: combinedLibrarySetup(libraryPath),
            registeredFiles: inputs.fileLocations,
            importedFiles: new Set(["LibraryCore.js"])
        };

        Object.entries(inputs.fileLocations).forEach(
            appendFile.bind(null, privateData)
        );

        // TODO: making a more stable and less ugly version for including LibraryTools
        let path = resolvePath(libraryRoot, "LibraryTools.js");
        appendFile(privateData, [Path.basename(path), path]);
        privateData.combinedFile += "ToolKid.registerFunctions({section:\"dataTypes\", subSection:\"checks\", functions: {\n\
            isArray:module.exports.isArray,\n\
        }});\n\n";
        path = resolvePath(libraryRoot, "LibraryTools_nodeJS.js");
        appendFile(privateData, [Path.basename(path), path]);
        privateData.combinedFile += "ToolKid.registerFunctions({section:\"nodeJS\", functions: {\n\
            loopFiles:module.exports.loopFiles,\n\
            readFile:module.exports.readFile,\n\
            writeFile:module.exports.writeFile,\n\
        }});\n\n";

        privateData.combinedFile += "global.log = ToolKid.debug.terminal.logImportant;\n";
        privateData.combinedFile += "module.exports = ToolKid;\n";
        privateData.combinedFile += "})();";
        LibraryTools.writeFile({
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
        let { content } = LibraryTools.readFile({ path });
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
            suspects: [ToolKid, LibraryTools],
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