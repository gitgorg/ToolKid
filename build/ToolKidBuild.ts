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
        const {resolvePath} = library.getCoreModule("files");
        const files = new Map([
            ["LibraryCore.js",{filePath:resolvePath(__dirname,"../LibraryFiles/LibraryCore.js")}],
            ["LibraryFiles.js",{filePath:resolvePath(__dirname,"../LibraryFiles/LibraryFiles.js")}],
            ["LibraryParsing.js",{filePath:resolvePath(__dirname, "../LibraryFiles/LibraryParsing.js")}]
        ]);
        Object.entries(fileLocations).forEach(function([importID, filePath]){
            files.set(importID, {filePath});
        });
        const test = library.getCoreModule("building").bundleFiles({
            fileList: files,
            fileParser: function (inputs) {
                let result = removeStrictMode(inputs.fileContent);
                result += '\n\
fileCollection.set("' + inputs.importID + '", module.exports);\n';
                if (inputs.importID === "LibraryCore.js") {
                    result += 'global.ToolKid = module.exports.createInstance();\n';
                } else if (inputs.importID.indexOf("Library") === 0) {
                    result += 'fileCollection.get("LibraryCore.js").registerCoreModule({\n\
    name: "' + inputs.importID.slice(7,-3).toLocaleLowerCase()+ '", module: module.exports\n\
});\n'
                }
                return result + '\n';
            },
            footer: '\n\
global.log = ToolKid.debug.terminal.logImportant;\n\
module.exports = ToolKid;\n\
})();'
        });
        library.getCoreModule("files").writeFile({
            path: config.exportFile || (__dirname.slice(0, -5) + "ToolKid.js"),
            // path: (__dirname + "/test.js"),
            content: test
        });

        if (config.runTests !== false) {
            setTimeout(
                runTests.bind(null, config), 100
            );
        }
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