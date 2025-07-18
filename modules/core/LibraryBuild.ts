interface LibraryCore_file {
    getCoreModule(name: "building"): LibraryBuild_file
}

type LibraryBuild_file = {
    bundlerDefaults: {
        header: string,
        footer: string,
    },

    bundleFile(
        bundleRegistry: Set<string>,
        getFileContent: (
            bundleRegistry: Set<string>,
            bundleID: string
        ) => string[],
        bundleIDs: string[],
    ): string[]
}



(function LibraryBuild_init() {
    const publicExports = module.exports = <LibraryBuild_file>{};

    publicExports.bundleFile = function LibraryBuild_bundleFile(
        bundleRegistry, getFileContent, bundleIDs,
    ) {
        const result = [] as string[];
        const length = bundleIDs.length;
        let bundleID: string;
        for (let i = 0; i < length; i += 1) {
            if (bundleRegistry.has(bundleIDs[i])) {
                continue;
            }

            bundleID = bundleIDs[i];
            bundleRegistry.add(bundleID);
            result.push(
                ...getFileContent(bundleRegistry, bundleID),
                '\nfileCollection.set("' + bundleID + '", module.exports);\n\n'
            );
        }
        return result;
    };

    publicExports.bundlerDefaults = {
        header: '"use strict";\n\
(function Library_bundledFiles_init() {\n\
const fileCollection = new Map();\n\n\n',
        footer: '\n})();'
    };



    Object.freeze(publicExports);
})();