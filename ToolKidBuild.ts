//combining all ToolKid parts
type ToolKidBuild_file = {
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
    console.log(">>  activating ToolKid");
    const FS = require("fs");
    const { basename, resolve } = require("path");
    const libraryCore = <LibraryCore_file><any>require(
        resolve(__dirname, "modules/core/LibraryCore.js")
    );
    const { createPathChecker, loopFiles, readFile, writeFile } = libraryCore.getCoreModule("files");
    const LibraryBuilding = libraryCore.getCoreModule("building");

    (<Dictionary>global).ToolKid = libraryCore.createInstance();
    const { replaceFileConnections } = <TK_CodeJS_file>require("./modules/code/TK_CodeJS.js");


    const publicExports = module.exports = <ToolKidBuild_file>{};





    let config;
    if (FS.existsSync(resolve("./ToolKidConfig.json"))) {
        config = <ToolKidConfig>JSON.parse(
            FS.readFileSync("./ToolKidConfig.json", "utf8")
        );
    } else {
        config = {}
    }
    loopFiles({
        path: resolve(__dirname, "modules"),
        includes: ["*.js", ...(config.include || [])],
        excludes: ["*.test.js", ...(config.exclude || [])],
        execute: require
    });

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
        const neededBundleIDs = new Set() as Set<string>;
        const content = replaceFileConnections({
            text: readFile(filePath).content,
            replacer: replacer.bind(null, neededBundleIDs)
        });
        if (!corePathCheck(filePath)) {
            return {
                neededBundleIDs: Array.from(neededBundleIDs),
                content,
            };
        }

        let moduleName = basename(bundleID).slice(7, -3);
        moduleName = moduleName[0].toLocaleLowerCase() + moduleName.slice(1);
        if (moduleName === "core") {
            content.push('global.ToolKid = module.exports.createInstance();'
            );
        } else {
            content.push('\
fileCollection.get("LibraryCore.js").registerCoreModule({\n\
    name: "', moduleName, '", module: module.exports\n\
});'
            );
        }
        return {
            neededBundleIDs: Array.from(neededBundleIDs),
            content,
        };
    };

    const replacer = function RS_build_replacer(
        neededBundleIDs: Set<string>, content: string
    ): string | void {
        const bundleID = basename(content.slice(1, -1));
        neededBundleIDs.add(bundleID);
        return 'fileCollection.get("' + bundleID + '")';
    };

    publicExports.write = function ToolKidBuild_write(config) {
        const exportPath = resolve(config.exportPath || (__dirname.slice(0, -5) + "ToolKid.js"));
        console.log(">>  writing Toolkid to " + exportPath);
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
                'console.log(">>  activating ToolKid");\n',
                ...LibraryBuilding.bundleFile({
                    readBundleContent: readBundleContent.bind(null, filePaths),
                    bundleIDs: [...filePaths.keys()]
                }), '\
\n\nglobal.log = ToolKid.debug.terminal.logImportant;\n\
module.exports = ToolKid;',
                LibraryBuilding.bundlerDefaults.footer
            ].join("")
        });
        if (config.runTests !== false) {
            runTests();
        }
    };



    Object.freeze(publicExports);
})();