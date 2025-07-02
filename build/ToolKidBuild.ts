//combining all ToolKid parts
type ToolKidBuild_file = {
    activate(
        inputs?: ToolKidConfig & {
            runTests?: true
        }
    ): void,
    write(
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
    const { basename, resolve } = require("path");



    const publicExports = module.exports = <ToolKidBuild_file>{};
    publicExports.activate = function ToolKidBuild_activate(config) {
        if (typeof ToolKid !== "undefined") {
            return;
        }

        console.log(">>  activate ToolKid");
        if (config === undefined) {
            config = readConfig();
        }
        const library = (<LibraryCore_file><any>require(
            resolve(config.rootLibraryFiles, "LibraryCore.js")
        )).createInstance();

        (<Dictionary>global).ToolKid = library;
        library.getCoreModule("files").loopFiles({
            path: config.rootToolKidFiles,
            includes: config.include,
            excludes: config.exclude,
            execute: require
        });
        console.log(">>  ToolKid ready");
        if (config.runTests === true) {
            runTests(config);
        }
    };

    const bundleHeader = '"use strict";\n\
(function ToolKid_bundle() {\n\
console.log(">>  activate ToolKid")\n\
const fileCollection = new Map();\n\n';

    const bundleParser = function ToolKidBuild_bundleParser(
        defaultBundler: { (inputs: any): string },
        inputs: { importID: string, fileContent: string }
    ) {
        let result = defaultBundler(inputs);
        if (inputs.importID === "LibraryCore.js") {
            result += 'global.ToolKid = module.exports.createInstance();\n';
        } else if (inputs.importID.indexOf("Library") === 0) {
            result += 'fileCollection.get("LibraryCore.js").registerCoreModule({\nname: "'
                + inputs.importID.slice(7, -3).toLocaleLowerCase()
                + '", module: module.exports\n});\n';
        }
        return result;
    }

    const bundleFooter = '\n\
global.log = ToolKid.debug.terminal.logImportant;\n\
module.exports = ToolKid;\n\
console.log(">>  ToolKid ready")\n\
})();';

    const registerExtensionFile = function ToolKidBuild_registerExtensionFile(
        pathsByFileName: Dictionary,
        path: string
    ) {
        const fileName = basename(path);
        if (pathsByFileName[fileName] !== undefined) {
            console.warn(
                "ToolKidBuild_registerExtensionFile - duplicate file name:",
                [pathsByFileName[fileName], path]
            );
        }
        pathsByFileName[fileName] = path;
    };

    const readConfig = function ToolKidBuild_readConfig() {
        let result = <ToolKidConfig>{
            rootToolKidFiles: "../ToolKidFiles",
            rootLibraryFiles: "../LibraryFiles",
            include: ["*.js"],
            exclude: ["*.test.js"]
        };
        const FS = require("fs");
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

    publicExports.write = function ToolKidBuild_executeBuild(config) {
        const filePath = config.exportPath || (__dirname.slice(0, -5) + "ToolKid.js");
        console.log(">>  write Toolkid to " + filePath);
        const libraryCore = <LibraryCore_file><any>require(
            resolve(config.rootLibraryFiles, "LibraryCore.js")
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

        const LibraryBuilding = libraryCore.getCoreModule("building");
        coreModuleFiles.writeFile({
            path: filePath,
            content: LibraryBuilding.bundleFiles({
                fileList: files,
                header: bundleHeader,
                fileParser: bundleParser.bind(null, LibraryBuilding.bundlerDefaults.fileParser),
                footer: bundleFooter,
            })
        });
        if (config.runTests !== false) {
            runTests(config);
        }
    };



    Object.freeze(publicExports);

    const executionFile = basename(process.argv[1]);
    const isExecutedViaTerminal = executionFile.slice(0, 12) === "ToolKidBuild";
    if (isExecutedViaTerminal) {
        publicExports.activate();
    }
})();