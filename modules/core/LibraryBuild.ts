interface LibraryCore_file {
    getCoreModule(name: "building"): LibraryBuild_file
}

type LibraryBuild_file = {
    bundlerDefaults: {
        header: string,
        fileParser: any,
        footer: string,
    },
    composeBundleContent(inputs: {
        header?: string,

        footer?: string,
    }): string,

    fileBundlePush(inputs: {
        fileContents: Map<string, string>,
        importID: string,
    } & ({
        fileContent: string,
    } | {
        fileParser: {
            (importID: string): string
        },
    })): void,
    fileBundleCombine(inputs:{
        header?: string,
        fileContents: Map<string, string>,
        footer?: string,
    }): string,
}



(function LibraryBuild_init() {
    const publicExports = module.exports = <LibraryBuild_file>{};

    publicExports.fileBundlePush = function LibraryBuild_fileBundlePush(
        inputs: Dictionary
    ) {
        const { importID } = inputs;
        const { fileContents } = inputs;
        if (fileContents.get(importID) === undefined) {
            fileContents.set(importID, inputs.fileContent || inputs.fileParser(importID));
        }
    };

    publicExports.fileBundleCombine = function LibraryBuild_fileBundleCombine(inputs) {
        return (inputs.header || publicExports.bundlerDefaults.header)
            + [...inputs.fileContents.values()].join("")
            + (inputs.footer || publicExports.bundlerDefaults.footer);
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