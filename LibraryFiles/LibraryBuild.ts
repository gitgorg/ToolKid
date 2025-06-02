interface LibraryCore_file {
    getCoreModule(name: "building"): LibraryBuild_file
}

type LibraryBuild_file = {
    bundleFiles(inputs: {
        fileList: Map<
            string, //importID
            { filePath: string } | { fileContent: string }
        >,

        header?: string,
        fileParser?(inputs: {
            importID: string,
            fileContent: string
        }): void | string,
        footer?: string,
    }): string,
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

    publicExports.bundleFiles = function LibraryBuild_bundleFiles(inputs) {
        if (!(typeof inputs.fileParser === "function")) {
            inputs.fileParser = defaultParser;
        }
        let result = inputs.header || defaultHeader;
        const registeredFiles = <Map<string, true>>new Map();
        inputs.fileList.forEach(function (data: Dictionary, importID) {
            if (registeredFiles.get(importID) === true) {
                return;
            }

            registeredFiles.set(importID, true);
            result += bundleFilesAppend(<any>inputs, importID);
        });
        return result + (inputs.footer || defaultFooter);
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

    const defaultHeader = '"use strict";\n\
(function Library_bundledFiles_init() {\n\
const fileCollection = new Map();\n\n';

    const defaultParser = function (inputs: {
        importID: string, fileContent: string
    }) {
        return removeStrictMode(inputs.fileContent) + '\n\
fileCollection.set("' + inputs.importID + '", module.exports);\n\n';
    };

    const defaultFooter = '\n\n})();';

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