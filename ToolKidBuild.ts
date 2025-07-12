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
    fileRoot: string,
    include?: string[],
    exclude?: string[],
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
            const FS = require("fs");
            if (FS.existsSync(resolve("./ToolKidConfig.json"))) {
                config = <ToolKidConfig>JSON.parse(
                    FS.readFileSync("./ToolKidConfig.json", "utf8")
                );
            } else {
                config = { fileRoot: "./" }
            }
        }
        (<Dictionary>global).ToolKid = (<LibraryCore_file><any>require(
            resolve(config.fileRoot, "modules/core/LibraryCore.js")
        )).createInstance();

        (<Library>ToolKid).getCoreModule("files").loopFiles({
            path: resolve(config.fileRoot, "modules"),
            includes: ["*.js", ...(config.include || [])],
            excludes: ["*.test.js", ...(config.exclude || [])],
            execute: require
        });
        console.log(">>  ToolKid ready");
        if (config.runTests === true) {
            runTests(config);
        }
    };

    const runTests = function ToolKidBuild_runTests(
        config: ToolKidConfig
    ) {
        setTimeout(ToolKid.debug.test.testFull.bind(null, {
            title: "ToolKid",
            path: [config.fileRoot],
            include: ["*.test.js"],
            suspects: [ToolKid],
        }), 100);
    };

    publicExports.write = function ToolKidBuild_executeBuild(config) {
        const libraryCore = <LibraryCore_file><any>require(
            resolve(config.fileRoot, "modules/core/LibraryCore.js")
        );
        const { createPathChecker, loopFiles, readFile, writeFile } = libraryCore.getCoreModule("files");
        const LibraryBuilding = libraryCore.getCoreModule("building");
        const { fileBundlePush } = LibraryBuilding;

        const filePath = config.exportPath || (__dirname.slice(0, -5) + "ToolKid.js");
        console.log(">>  write Toolkid to " + filePath);
        const fileRegistry = <Map<string, string>>new Map();
        loopFiles({
            path: resolve(config.fileRoot, "modules"),
            includes: ["*.js", ...(config.include || [])],
            excludes: ["*.test.js", ...(config.exclude || [])],
            execute: function ToolKidBuil_executeBuildCoreModules(filePath) {
                fileRegistry.set(basename(filePath), filePath);
            }
        });
        const fileContents = new Map() as Map<string, string>;
        const readFileContent = function ToolKidBuild_readFileContent(fileName: string): string {
            return readFile(<string>fileRegistry.get(fileName)).content;
        };
        const fileParserRegular = function (importID: string) {
            return '\n' + readFileContent(importID)
                + 'fileCollection.set("' + importID + '", module.exports);'
        };
        const fileParserCore = function (importID: string) {
            let moduleName = importID.slice(7, -3);
            moduleName = moduleName[0].toLocaleLowerCase() + moduleName.slice(1);
            return fileParserRegular(importID)
                + '\nfileCollection.get("LibraryCore.js").registerCoreModule({\nname: "'
                + moduleName
                + '", module: module.exports\n});\n';
        };
        fileBundlePush({
            fileContents, importID: "LibraryCore.js",
            fileContent: readFileContent("LibraryCore.js") + '\n'
                + 'fileCollection.set("LibraryCore.js", module.exports);\n'
                + 'global.ToolKid = module.exports.createInstance();\n\n',
        });
        fileBundlePush({ fileContents, fileParser: fileParserCore, importID: "LibraryRegularExpression.js" });
        let coreCheck = createPathChecker({ includes: ["*/modules/core/*"] });
        fileRegistry.forEach(function (filePath, importID) {
            if (coreCheck(filePath)) {
                fileBundlePush({ fileContents, fileParser: fileParserCore, importID });
            }
        });

        fileRegistry.forEach(function (filePath, importID) {
            if (!coreCheck(filePath)) {
                fileBundlePush({ fileContents, fileParser: fileParserRegular, importID });
            }
        });

        writeFile({
            path: filePath,
            content: LibraryBuilding.fileBundleCombine({
                header: '"use strict";\n\
(function ToolKid_bundle() {\n\
console.log(">>  activate ToolKid");\n\
const fileCollection = new Map();\n\n',
                fileContents,
                footer: '\n\nglobal.log = ToolKid.debug.terminal.logImportant;\n\
module.exports = ToolKid;\n\
console.log(">>  ToolKid ready");\n\
})();'
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