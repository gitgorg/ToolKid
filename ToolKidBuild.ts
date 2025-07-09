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
        const library = (<LibraryCore_file><any>require(
            resolve(config.fileRoot, "modules/core/LibraryCore.js")
        )).createInstance();

        (<Dictionary>global).ToolKid = library;
        executeFiles({ library, config, execute: require });
        console.log(">>  ToolKid ready");
        if (config.runTests === true) {
            runTests(config);
        }
    };

    const bundleHeader = '"use strict";\n\
(function ToolKid_bundle() {\n\
console.log(">>  activate ToolKid");\n\
const fileCollection = new Map();\n\n';

    const bundleParser = function ToolKidBuild_bundleParser(
        defaultBundler: { (inputs: any): string },
        inputs: { importID: string, fileContent: string }
    ) {
        let result = defaultBundler(inputs);
        if (inputs.importID === "LibraryCore.js") {
            result += 'global.ToolKid = module.exports.createInstance();\n';
        } else if (inputs.importID.indexOf("Library") === 0) {
            let importID = inputs.importID.slice(7, -3);
            importID = importID[0].toLocaleLowerCase() + importID.slice(1);
            result += 'fileCollection.get("LibraryCore.js").registerCoreModule({\nname: "'
                + importID
                + '", module: module.exports\n});\n';
        }
        return result;
    }

    const bundleFooter = '\n\
global.log = ToolKid.debug.terminal.logImportant;\n\
module.exports = ToolKid;\n\
console.log(">>  ToolKid ready");\n\
})();';

    const executeFiles = function ToolKidBuild_executeFiles(inputs: {
        library: Library | LibraryCore_file,
        config: ToolKidConfig,
        execute: Parameters<LibraryFiles_file["loopFiles"]>[0]["execute"]
    }) {
        const { config } = inputs;
        inputs.library.getCoreModule("files").loopFiles({
            path: resolve(config.fileRoot, "modules"),
            includes: ["*.js", ...(config.include || [])],
            excludes: [
                "*.test.js", resolve(config.fileRoot, "modules/core/*"),
                ...(config.exclude || [])
            ],
            execute: inputs.execute
        });
    }

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
        const filePath = config.exportPath || (__dirname.slice(0, -5) + "ToolKid.js");
        console.log(">>  write Toolkid to " + filePath);
        const libraryCore = <LibraryCore_file><any>require(
            resolve(config.fileRoot, "modules/core/LibraryCore.js")
        );
        const { loopFiles, resolvePath, writeFile } = libraryCore.getCoreModule("files");
        const fileLocations = <{ [fileName: string]: string }>{};
        executeFiles({
            library: libraryCore,
            config,
            execute: registerExtensionFile.bind(null, fileLocations)
        });
        const files = new Map([
            ["LibraryCore.js", {
                filePath: resolvePath(
                    __dirname, "./modules/core/LibraryCore.js"
                )
            }],
            ["LibraryRegularExpression.js", {
                filePath: resolvePath(
                    __dirname, "./modules/core/LibraryRegularExpression.js"
                )
            }],
        ]);
        loopFiles({
            path: resolve(config.fileRoot, "modules/core"),
            includes: ["*.js", ...(config.include || [])],
            excludes: ["*.test.js", "*LibraryCore.js", ...(config.exclude || [])],
            execute: function ToolKidBuil_executeBuildCoreModules(filePath) {
                files.set(basename(filePath), { filePath });
            }
        });
        Object.entries(fileLocations).forEach(function ([importID, filePath]) {
            files.set(importID, { filePath });
        });

        const LibraryBuilding = libraryCore.getCoreModule("building");
        writeFile({
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