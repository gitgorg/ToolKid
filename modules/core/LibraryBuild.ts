interface LibraryCore_file {
    getCoreModule(name: "building"): LibraryBuild_file
}

type LibraryBuild_file = {
    bundlerDefaults: {
        header: string,
        fileParser: any,
        footer: string,
    },

    bundleFile(
        bundleRegistry: Set<string>,
        getFileContent: (
            bundleRegistry: Set<string>,
            bundleID: string
        ) => string[],
        bundleID: string,
    ): string[]

    fileBundleCombine(inputs: {
        header?: string,
        fileContents: Map<string, string>,
        footer?: string,
    }): string,
}



(function LibraryBuild_init() {
    const publicExports = module.exports = <LibraryBuild_file>{};

    publicExports.bundleFile = function RS_build_bundleFile(
        bundleRegistry, getFileContent, bundleID,
    ) {
        bundleRegistry.add(bundleID);
        return [
            ...getFileContent(bundleRegistry, bundleID),
            '\nfileCollection.set("' + bundleID + '", module.exports);'
        ];
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