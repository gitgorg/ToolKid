interface LibraryCore_file {
    getCoreModule(name: "building"): LibraryBuild_file
}

type LibraryBuild_file = {
    fileBundleSetup(inputs: {
        header?: string,
        footer?: string,
    }): FileBundleData,
    fileBundlePush(inputs: {
        bundleData: FileBundleData,
        fileKey: string,
        fileContent: string,
    }): void,
    fileBundleCombine(
        bundleData: FileBundleData
    ): string,

    bundlerDefaults: {
        header: string,
        fileParser(inputs: {
            importID: string,
            fileContent: string
        }): void | string,
        footer: string,
    },
    composeBundleContent(inputs: {
        header?: string,

        footer?: string,
    }): string,
}

type FileBundleData = {
    header: string,
    fileContents: Map<string, string>,
    fileOrder: Set<string>,
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

    publicExports.fileBundleSetup = function LibraryBuild_fileBundleSetup(inputs) {
        return {
            header: inputs.header || publicExports.bundlerDefaults.header,
            fileContents: new Map(),
            fileOrder: new Set(),
            footer: inputs.footer || publicExports.bundlerDefaults.footer,
        };
    };

    publicExports.fileBundlePush = function LibraryBuild_fileBundlePush(inputs) {
        const { fileKey } = inputs;
        const { fileContents, fileOrder } = inputs.bundleData;
        fileOrder.delete(fileKey);
        fileOrder.add(fileKey);
        if (fileContents.get(fileKey) === undefined) {
            fileContents.set(fileKey, inputs.fileContent);
        }
    };

    publicExports.fileBundleCombine = function LibraryBuild_fileBundleCombine(inputs) {
        const { fileContents } = inputs;
        const fileOrder = [...inputs.fileOrder.keys()];
        let result = inputs.header;
        for (let i = fileOrder.length - 1; i > -1; i -= 1) {
            result += fileContents.get(fileOrder[i]);
        }
        return result + inputs.footer;
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
        footer: '\n\n})();'
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