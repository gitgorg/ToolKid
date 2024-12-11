//combining all ToolKid parts
type ToolKidBuild_file = {(inputs?:ToolKidConfig): void}

declare const ToolKid: ToolKid_file

interface ToolKid_file extends Library {}

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
    let Library: Library_file;



    const getAlias = function ToolKidBuild_getAlias (path:string) {
        path = Path.basename(path);
        if (Path.extname(path) === "") {
            path += ".js";
        }
        return path;
    };

    const combinedLibrarySetup = function (libraryPath: string) {
        let combinedLibraryContent = "\"use strict\";\n";
        combinedLibraryContent += "(function ToolKid_init () {\n";
        combinedLibraryContent += "const registeredFiles = {};\n\n\n";
        combinedLibraryContent += FS.readFileSync(libraryPath,"utf8").slice(14, -7);
        combinedLibraryContent += "\n    global.ToolKid = publicExports.createInstance();";
        combinedLibraryContent += "\n})();\n";
        combinedLibraryContent += "registeredFiles[\"Library.js\"] = module.exports;\n\n";
        return combinedLibraryContent;
    };

    const collectToolKid = function ToolKidBuild_collectToolKid(
        config:ToolKidConfig
    ) {
        module.exports = (<Dictionary>global).ToolKid = Library.createInstance();
        const LibraryTools = Library.getTools();

        const privateData = {
            registeredFiles: {},
        };

        ToolKid.registerFunction({
            section: "nodeJS", functions: {
                isDirectory: LibraryTools.isDirectory,
                loopFiles: LibraryTools.loopFiles,
                resolvePath: LibraryTools.resolvePath
            }
        });
        ToolKid.registerFunction({
            section: "dataTypes", subSection:"checks", functions: {
                isArray: LibraryTools.isArray
            }
        });

        LibraryTools.loopFiles({
            path: config.rootToolKidFiles,
            include: config.include,
            exclude: config.exclude,
            execute: LibraryTools.partial(executeAndRegisterFile,privateData.registeredFiles)
        });
        return privateData.registeredFiles;
    };

    const writeLibraryFile = function (inputs:{
        rootLibraryFiles:string,
        fileLocations:Dictionary,
        exportFile?:string
    }) {
        const libraryPath = Path.resolve(inputs.rootLibraryFiles)+"/Library.js";

        const privateData = {
            combinedFile: combinedLibrarySetup(libraryPath),
            registeredFiles: inputs.fileLocations,
            importedFiles: new Set(["Library.js"])
        };

        Object.entries(privateData.registeredFiles).forEach(
            appendFile.bind(null,privateData)
        );

        // TODO: making a more stable and less ugly version for including LibraryTools
        const toolsPath = Path.resolve(inputs.rootLibraryFiles,"LibraryTools.js");
        appendFile(privateData,[Path.basename(toolsPath),toolsPath]);
        privateData.combinedFile += "ToolKid.registerFunction({section:\"nodeJS\", functions: {\n\
            loopFiles:module.exports.loopFiles\n\
        }})\n\n";
        privateData.combinedFile += "ToolKid.registerFunction({section:\"DataTypes\", subSection:\"checks\", functions: {\n\
            isArray:module.exports.isArray\n\
        }})\n\n";

        privateData.combinedFile += "global.log = ToolKid.debug.terminal.logImportant;\n";
        privateData.combinedFile += "module.exports = ToolKid;\n";
        privateData.combinedFile += "})();";
        Library.getTools().writeFile({
            path: inputs.exportFile || (__dirname.slice(0,-5) + "ToolKid.js"),
            content: privateData.combinedFile
        });
    };

    const executeAndRegisterFile = function (
        registeredFiles: Dictionary,
        path:string
    ) {
        const alias = getAlias(path);
        if (registeredFiles[alias] !== undefined) {
            console.warn("duplicate file alias \""+ alias + "\" - second path is:",path, " and registered was:",registeredFiles[alias]);
        }
        registeredFiles[alias] = path;
        return require(path);
    };

    const appendFile = function (
        privateData: Dictionary,
        aliasAndPath: [alias:string, path:string]
    ) {
        const [aliasOfFile, filePath] = aliasAndPath;
        if (privateData.importedFiles.has(aliasOfFile)) {
            return;
        }

        const analysed = analyseFile(filePath);
        analysed.imports.forEach(function(entry){
            const aliasOfDependency = getAlias(entry.file);
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

    const analyseFile = function (path:string): {
        path: string,
        contentReworked: string,
        imports: {
            position:number,
            file:string
        }[]
    } {
        let content = <string>FS.readFileSync(path,"utf8");
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
            let name = getAlias(entry.file);
            contentReworked += "registeredFiles[\""+name+"\"]";
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
    const getImports = function (content:string) {
        const parts = content.split(signals.requireStart);
        if (parts.length === 1) {
            return [];
        }

        let position = parts[0].length;
        const result = <{position:number, file:string}[]>[];
        for (let i=1; i< parts.length; i+=1) {
            const part = parts[i];
            const end = part.indexOf(signals.requireEnd);
            result.push({
                position,
                file: part.slice(0,end)
            });
            position += part.length + signals.requireStart.length;
        }
        return result;
    };

    const executeBuild = <ToolKidBuild_file>function ToolKidBuild_executeBuild (config) {
        if (typeof ToolKid !== "undefined") {
            return;
        }

        console.log("building ToolKid");
        if (config === undefined) {
            config = readConfig();
        }
        Library = require(Path.resolve(config.rootLibraryFiles,"Library"));
        const fileList = collectToolKid(config);
        (<Dictionary>global).log = (<ToolKid_file>ToolKid).debug.terminal.logImportant;
        writeLibraryFile({
            rootLibraryFiles:config.rootLibraryFiles,
            fileLocations:fileList,
            exportFile: config.exportFile
        });
        if (config.runTests !== false) {
            setTimeout(
                runTests.bind(null,config)
            ,100);
        }
    };

    const readConfig = function ToolKidBuild_readConfig () {
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

    const prepareInputsFullTest = function ToolKidBuild_prepareInputsFullTest (
        config: ToolKidConfig
    ) {
        return {
            path: (typeof config.rootToolKidFiles === "string")
                ? [config.rootToolKidFiles, config.rootLibraryFiles]
                : [...config.rootToolKidFiles, config.rootLibraryFiles],
            include: ["*.test.js"],
            exclude: config.exclude.slice(1),
            title: "ToolKid"
        }
    };

    const runTests = function ToolKidBuild_runTests (
        config:ToolKidConfig
    ) {
        console.log(">> testing ToolKid");
        ToolKid.debug.test.registerTestSuspect({
            suspect: ToolKid,
            mode: "allMethods"
        });
        ToolKid.debug.test.registerTestSuspect({
            suspect: Library.getTools(),
            mode: "allMethods"
        });
        ToolKid.debug.test.testFull(
            prepareInputsFullTest(config)
        );
    };

    const executionFile = Path.basename(process.argv[1]);
    const isExecutedDirectly = executionFile.slice(0,12) === "ToolKidBuild";
    if (isExecutedDirectly) {
        executeBuild();
    }

    module.exports = executeBuild;
})();