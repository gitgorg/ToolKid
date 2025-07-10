interface LibraryCore_file {
    getCoreModule(name: "building"): LibraryBuild_file
}

type LibraryBuild_file = {
    bundlerDefaults: {
        header: string,
        fileParser(inputs: {
            importID: string,
            fileContent: string
        }): string,
        footer: string,
    },
    bundleFiles(inputs: {
        header?: string,
        fileParser?: GenericFunction,
        fileList: Map<string, {
            filePath: string
        }>,
        footer?: string,
    }): string,
    composeBundleContent(inputs: {
        header?: string,

        footer?: string,
    }): string,

    fileBundleSetup(inputs?: {
        header?: string,
        footer?: string,
    }): FileBundleData,
    fileBundlePush(inputs: {
        bundleData: FileBundleData,
        importID: string,
        fileContent: string,
        fileParser?: false | {
            (inputs: {
                importID: string,
                fileContent: string,
            }): string
        }
    }): void,
    fileBundleCombine(
        bundleData: FileBundleData
    ): string,
}

type FileBundleData = {
    header: string,
    fileContents: Map<string, string>,
    footer: string,
}



(function LibraryBuild_init() {
    const {
        existsSync: isUsedPath,
        lstatSync: readPathStats,
        readFileSync: readFile,
    } = require("fs");
    const {
        resolve: resolvePath,
    } = require("path");




    const publicExports = module.exports = <LibraryBuild_file>{};

    publicExports.fileBundleSetup = function LibraryBuild_fileBundleSetup(inputs = {}) {
        return {
            header: inputs.header || publicExports.bundlerDefaults.header,
            fileContents: new Map(),
            footer: inputs.footer || publicExports.bundlerDefaults.footer,
        };
    };

    publicExports.fileBundlePush = function LibraryBuild_fileBundlePush(inputs) {
        const { importID } = inputs;
        const { fileContents } = inputs.bundleData;
        if (fileContents.get(importID) !== undefined) {
            return;
        }

        if (inputs.fileParser === false) {
            fileContents.set(importID, inputs.fileContent);
        } else {
            const fileParser = inputs.fileParser || publicExports.bundlerDefaults.fileParser;
            fileContents.set(importID, fileParser({
                importID, fileContent: inputs.fileContent
            }));
        }
    };

    publicExports.fileBundleCombine = function LibraryBuild_fileBundleCombine(bundleData) {
        return bundleData.header
        + [...bundleData.fileContents.values()].join("")
        + bundleData.footer;
    };

    publicExports.bundleFiles = function LibraryBuild_bundleFiles(inputs) {
        const defaults = publicExports.bundlerDefaults;
        if (!(typeof inputs.fileParser === "function")) {
            inputs.fileParser = defaults.fileParser;
        }
        let result = inputs.header || defaults.header;
        const registeredFiles = new Set();
        inputs.fileList.forEach(function (data: Dictionary, importID) {
            if (registeredFiles.has(importID) === true) {
                return;
            }

            registeredFiles.add(importID);
            result += bundleFilesAppend(<any>inputs, importID);
        });
        return result + (inputs.footer || defaults.footer);
    };

    const bundleFilesAppend = function LibraryBuild_bundleFilesAppend(
        boundInputs: {
            fileList: Map<string, Dictionary>,
            fileParser(inputs: {
                importID: string,
                fileContent: string
            }): string
        },
        importID: string
    ) {
        const data = boundInputs.fileList.get(importID);
        if (data === undefined) {
            console.warn(["LibraryBuild_bundleFiles - unknown importID:", importID]);
            return "";
        }

        let fileContent = data.fileContent;
        if (data.fileContent === undefined) {
            const filePath = resolvePath(data.filePath);
            if (!isUsedPath(filePath) || readPathStats(filePath).isDirectory()) {
                return;
            }

            fileContent = readFile(filePath, "utf8");
        }
        return boundInputs.fileParser({ importID, fileContent });
    };

    publicExports.bundlerDefaults = {
        header: '"use strict";\n\
(function Library_bundledFiles_init() {\n\
const fileCollection = new Map();\n\n',
        fileParser: function LibraryBuild_defaultFileParser(inputs: {
            importID: string, fileContent: string
        }) {
            return removeStrictMode(inputs.fileContent) + '\n\
fileCollection.set("' + inputs.importID + '", module.exports);\n\n';
        },
        footer: '})();'
    };

    const removeStrictMode = function ToolKidBuild_removeStrictMode(fileContent: string) {
        const firstPosition = fileContent.indexOf("use strict") - 1;
        if (firstPosition !== -2 && firstPosition < 20) {
            return fileContent.slice(firstPosition + 13).trim();
        } else {
            return fileContent;
        }
    };



    Object.freeze(publicExports);
})();