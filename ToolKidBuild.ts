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
    include?: string[],
    exclude?: string[],
}



(function ToolKidBuild_init() {
    const { basename, resolve } = require("path");
    const libraryCore = <LibraryCore_file><any>require(
        resolve(__dirname, "modules/core/LibraryCore.js")
    );
    const { createPathChecker, loopFiles, readFile, writeFile } = libraryCore.getCoreModule("files");
    const LibraryBuilding = libraryCore.getCoreModule("building");



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
                config = {}
            }
        }
        (<Dictionary>global).ToolKid = libraryCore.createInstance();

        loopFiles({
            path: resolve(__dirname, "modules"),
            includes: ["*.js", ...(config.include || [])],
            excludes: ["*.test.js", ...(config.exclude || [])],
            execute: require
        });
        console.log(">>  ToolKid ready");
        if (config.runTests === true) {
            runTests();
        }
    };

    const runTests = function ToolKidBuild_runTests() {
        setTimeout(ToolKid.debug.test.testFull.bind(null, {
            title: "ToolKid",
            path: [__dirname],
            include: ["*.test.js"],
            suspects: [ToolKid],
        }), 100);
    };

    const corePathCheck = createPathChecker({ includes: ["*/modules/core/*"] });
    const readBundleContent = function TooloKidBuild_readBundleContent(
        filePaths: Map<string, string>,
        bundleID: string,
    ) {
        const filePath = filePaths.get(bundleID) as string;
        const result = [
            readFile(filePath).content,
        ];
        if (!corePathCheck(filePath)) {
            return result;
        }

        let moduleName = bundleID.slice(7, -3);
        moduleName = moduleName[0].toLocaleLowerCase() + moduleName.slice(1);
        if (moduleName === "core") {
            result.push('global.ToolKid = module.exports.createInstance();'
            );
        } else {
            result.push('\
fileCollection.get("LibraryCore.js").registerCoreModule({\n\
    name: "', moduleName, '", module: module.exports\n\
});'
            );
        }
        return result;
    };

    publicExports.write = function ToolKidBuild_write(config) {
        const exportPath = config.exportPath || (__dirname.slice(0, -5) + "ToolKid.js");
        console.log(">>  write Toolkid to " + exportPath);
        const filePaths = new Map([
            ["LibraryCore.js", ""], ["LibraryRegularExpression.js", ""]
        ]);
        loopFiles({
            path: [
                resolve(__dirname, "modules/core"), //library core first
                resolve(__dirname, "modules")
            ],
            includes: ["*.js", ...(config.include || [])],
            excludes: ["*.test.js", ...(config.exclude || [])],
            execute: function ToolKidBuil_executeBuildCoreModules(filePath) {
                filePaths.set(basename(filePath), filePath);
            }
        });

        writeFile({
            path: exportPath,
            content: [
                LibraryBuilding.bundlerDefaults.header,
                'console.log(">>  activate ToolKid");\n',
                ...LibraryBuilding.bundleFile(
                    { readBundleContent: readBundleContent.bind(null, filePaths) },
                    [...filePaths.keys()],
                ), '\
\n\nglobal.log = ToolKid.debug.terminal.logImportant;\n\
module.exports = ToolKid;\n\
console.log(">>  ToolKid ready");',
                LibraryBuilding.bundlerDefaults.footer
            ].join("")
        });
        if (config.runTests !== false) {
            runTests();
        }
    };



    Object.freeze(publicExports);

    const executionFile = basename(process.argv[1]);
    const isExecutedViaTerminal = executionFile.slice(0, 12) === "ToolKidBuild";
    if (isExecutedViaTerminal) {
        publicExports.activate();
    }
})();