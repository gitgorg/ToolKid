//combining all ToolKid parts
type ToolKidBuild_file = {
    (inputs?: ToolKidConfig): void
}

declare const ToolKid: ToolKid_file

interface ToolKid_file extends Library { }

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
    let LibraryCore: LibraryCore_file;



    module.exports = <ToolKidBuild_file>function ToolKidBuild_executeBuild(config) {
        if (typeof ToolKid !== "undefined") {
            return;
        }

        config = config || readConfig();
        LibraryCore = require(
            Path.resolve(config.rootLibraryFiles, "LibraryCore.js")
        );
        const tools = LibraryCore.getTools();
        const library = (<Dictionary>global).ToolKid = LibraryCore.createInstance();
        addCoreFunctions({ library, tools });
        const pathsByFileName = addExtendedFunctions({ config, tools });
        module.exports = library;

        writeLibraryFile({
            exportFile: config.exportFile,
            fileLocations: pathsByFileName,
            rootLibraryFiles: config.rootLibraryFiles,
            tools
        });
        if (config.runTests !== false) {
            setTimeout(
                runTests.bind(null, config), 100
            );
        }
    };

    const toolPlacement = {
        "isArray": ["dataTypes", "checks"],
        "isDirectory": ["nodeJS"],
        "loopFiles": ["nodeJS"],
        "readFile": ["nodeJS"],
        "resolvePath": ["nodeJS"],
        "writeFile": ["nodeJS"],
    };



    const addCoreFunctions = function ToolKidBuild_addCoreFunctions(inputs: {
        library: Library,
        tools: LibraryTools_file
    }) {
        const { library, tools } = inputs;
        Object.entries(toolPlacement).forEach(function([key,sections]){
            const functions = <Dictionary>{};
            functions[key] = tools[<"isArray">key];
            library.registerFunctions({
                section: sections[0], subSection:sections[1],
                functions
            });
        });
    };

    const addExtendedFunctions = function ToolKidBuild_addExtendedFunctions(inputs: {
        config: ToolKidConfig,
        tools: LibraryTools_file
    }) {
        const { config, tools } = inputs;
        const pathsByFileName = {};
        tools.loopFiles({
            path: config.rootToolKidFiles,
            include: config.include,
            exclude: config.exclude,
            execute: tools.partial(registerExtendedFile, pathsByFileName)
        });
        return pathsByFileName;
    };

    const combinedLibrarySetup = function (libraryPath: string) {
        let combinedLibraryContent = "\"use strict\";\n";
        combinedLibraryContent += "(function ToolKid_init () {\n";
        combinedLibraryContent += "const registeredFiles = {};\n\n\n";
        combinedLibraryContent += FS.readFileSync(libraryPath, "utf8").slice(14, -7);
        combinedLibraryContent += "\n    global.ToolKid = publicExports.createInstance();";
        combinedLibraryContent += "\n})();\n";
        combinedLibraryContent += "registeredFiles[\"LibraryCore.js\"] = module.exports;\n\n";
        return combinedLibraryContent;
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
        return require(path);
    };

    const writeLibraryFile = function (inputs: {
        rootLibraryFiles: string,
        fileLocations: Dictionary,
        exportFile?: string,
        tools: LibraryTools_file
    }) {
        const { rootLibraryFiles } = inputs;
        const { resolvePath } = inputs.tools;
        const libraryPath = resolvePath(rootLibraryFiles) + "/LibraryCore.js";

        const privateData = {
            combinedFile: combinedLibrarySetup(libraryPath),
            registeredFiles: inputs.fileLocations,
            importedFiles: new Set(["LibraryCore.js"])
        };

        Object.entries(privateData.registeredFiles).forEach(
            appendFile.bind(null, privateData)
        );

        // TODO: making a more stable and less ugly version for including LibraryTools
        let path = resolvePath(rootLibraryFiles, "LibraryTools.js");
        appendFile(privateData, [Path.basename(path), path]);
        privateData.combinedFile += "ToolKid.registerFunctions({section:\"dataTypes\", subSection:\"checks\", functions: {\n\
            isArray:module.exports.isArray,\n\
        }});\n\n";
        path = resolvePath(rootLibraryFiles, "LibraryTools_nodeJS.js");
        appendFile(privateData, [Path.basename(path), path]);
        privateData.combinedFile += "ToolKid.registerFunctions({section:\"nodeJS\", functions: {\n\
            loopFiles:module.exports.loopFiles,\n\
            readFile:module.exports.readFile,\n\
            writeFile:module.exports.writeFile,\n\
        }});\n\n";

        privateData.combinedFile += "global.log = ToolKid.debug.terminal.logImportant;\n";
        privateData.combinedFile += "module.exports = ToolKid;\n";
        privateData.combinedFile += "})();";
        LibraryCore.getTools().writeFile({
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

        const analysed = analyseFile(filePath);
        analysed.imports.forEach(function (entry) {
            const aliasOfDependency = Path.basename(entry.file);
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

    const analyseFile = function (path: string): {
        path: string,
        contentReworked: string,
        imports: {
            position: number,
            file: string
        }[]
    } {
        let content = <string>FS.readFileSync(path, "utf8");
        let contentClean = content.slice(14);
        let imports = getImports(contentClean);
        imports = imports.filter(function (entry) {
            return entry.file !== "fs" && entry.file !== "path";
        });
        if (imports.length === 0) {
            return {
                path,
                contentReworked: contentClean,
                imports: []
            };
        }

        let contentReworked = "";
        let position = 0;
        imports.forEach(function (entry) {
            const importPosition = entry.position;
            contentReworked += contentClean.slice(position, importPosition);
            let name = Path.basename(entry.file);
            contentReworked += "registeredFiles[\"" + name + "\"]";
            position = importPosition + entry.file.length + 11;
        });
        contentReworked += contentClean.slice(position);
        const result = {
            path,
            contentReworked,
            imports
        };
        return result;
    };

    const signals = {
        requireStart: "require(\"",
        requireEnd: "\")"
    };
    const getImports = function (content: string) {
        const parts = content.split(signals.requireStart);
        if (parts.length === 1) {
            return [];
        }

        let position = parts[0].length;
        const result = <{ position: number, file: string }[]>[];
        for (let i = 1; i < parts.length; i += 1) {
            const part = parts[i];
            const end = part.indexOf(signals.requireEnd);
            result.push({
                position,
                file: part.slice(0, end)
            });
            position += part.length + signals.requireStart.length;
        }
        return result;
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
            suspects: [ToolKid, LibraryCore.getTools()]
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