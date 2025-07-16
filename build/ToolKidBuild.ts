//combining all ToolKid parts
type ToolKidBuild_file = {
    activateToolKid(
        inputs?: ToolKidConfig & {
            runTests?: true
        }
    ): void,
    writeToolKid(
        inputs: ToolKidConfig & {
            exportPath?: string,
            runTests?: false,
        }
    ): void,
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
}



(function ToolKidBuild_init() {
    const FS = require("fs");
    const Path = require("path");



    const publicExports = module.exports = <ToolKidBuild_file>{};
    publicExports.activateToolKid = function ToolKidBuild_activateToolKid(config) {
        if (typeof ToolKid !== "undefined") {
            return;
        }

        console.log(">> activate ToolKid");
        if (config === undefined) {
            config = readConfig();
        }
        const library = (<any>require(
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
        coreModuleFiles.loopFiles({
            path: config.rootToolKidFiles,
            includes: config.include,
            excludes: config.exclude,
            execute: require
        });
        console.log(">> ToolKid ready");
        if (config.runTests === true) {
            runTests(config);
        }
    };

    const bundleHeader = '"use strict";\n\
(function ToolKid_bundle() {\n\
const fileCollection = new Map();\n\n';

    const bundleParser = function ToolKidBuild_bundleParser(inputs: {
        importID: string, fileContent: string
    }) {
        let result = removeStrictMode(inputs.fileContent);
        result += '\nfileCollection.set("' + inputs.importID + '", module.exports);\n';
        if (inputs.importID === "LibraryCore.js") {
            result += 'global.ToolKid = module.exports.createInstance();\n';
        } else if (inputs.importID.indexOf("Library") === 0) {
            result += 'fileCollection.get("LibraryCore.js").registerCoreModule({\nname: "'
                + inputs.importID.slice(7, -3).toLocaleLowerCase()
                + '", module: module.exports\n});\n';
        }
        return result + '\n';
    };

    const bundleFooter = '\n\
global.log = ToolKid.debug.terminal.logImportant;\n\
module.exports = ToolKid;\n\
console.log(">> ToolKid ready")\n\
})();';

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

    const runTests = function ToolKidBuild_runTests(
        config: ToolKidConfig
    ) {
        setTimeout(ToolKid.debug.test.testFull.bind(null, {
            title: "ToolKid",
            path: (typeof config.rootToolKidFiles === "string")
                ? [config.rootToolKidFiles, config.rootLibraryFiles]
                : [...config.rootToolKidFiles, config.rootLibraryFiles],
            include: ["*.test.js"],
            exclude: config.exclude.slice(1),
            suspects: [ToolKid],
        }), 100);
    };

    publicExports.writeToolKid = function ToolKidBuild_executeBuild(config) {
        const libraryCore = <any>require(
            Path.resolve(config.rootLibraryFiles, "LibraryCore.js")
        );
        const coreModuleFiles = libraryCore.getCoreModule("files");
        const fileLocations = <{ [fileName: string]: string }>{};
        coreModuleFiles.loopFiles({
            path: config.rootToolKidFiles,
            includes: config.include,
            excludes: config.exclude,
            execute: registerExtensionFile.bind(null, fileLocations)
        });
        const { resolvePath } = coreModuleFiles;
        const files = new Map([
            ["LibraryCore.js", { filePath: resolvePath(__dirname, "../LibraryFiles/LibraryCore.js") }],
            ["LibraryFiles.js", { filePath: resolvePath(__dirname, "../LibraryFiles/LibraryFiles.js") }],
            ["LibraryParsing.js", { filePath: resolvePath(__dirname, "../LibraryFiles/LibraryParsing.js") }]
        ]);
        Object.entries(fileLocations).forEach(function ([importID, filePath]) {
            files.set(importID, { filePath });
        });

        coreModuleFiles.writeFile({
            path: config.exportPath || (__dirname.slice(0, -5) + "ToolKid.js"),
            content: libraryCore.getCoreModule("building").bundleFiles({
                fileList: files,
                header: bundleHeader,
                fileParser: bundleParser,
                footer: bundleFooter,
            })
        });
        if (config.runTests !== false) {
            runTests(config);
        }
    };



    Object.freeze(module.exports);

    const executionFile = Path.basename(process.argv[1]);
    const isExecutedViaTerminal = executionFile.slice(0, 12) === "ToolKidBuild";
    if (isExecutedViaTerminal) {
        module.exports();
    }
})();