interface LibraryCore_file {
    getCoreModule(name: "building"): LibraryBuild_file
}

type LibraryBuild_file = {
    bundlerDefaults: {
        header: string,
        bundleAfter(
            bundleID: string
        ): string,
        footer: string,
    },

    bundleFile(
        privateData: {
            readBundleContent: (
                bundleID: string
            ) => string[] | BundleContent,
            bundleRegistry?: Set<string>,
            bundleAfter?: LibraryBuild_file["bundlerDefaults"]["bundleAfter"] | false,
        },
        bundleIDs: string[],
    ): string[]
}

type BundleContent = {
    neededBundleIDs?: string[],
    content: string[]
}



(function LibraryBuild_init() {
    type PrivateData = {
        readBundleContent(
            bundleID: string
        ): (string[] | BundleContent),
        bundleRegistry: Set<string>,
        bundleAfter: LibraryBuild_file["bundlerDefaults"]["bundleAfter"]
    }

    const publicExports = module.exports = <LibraryBuild_file>{};

    const returnNone = <any>function LibraryBuild_returnNone() { };
    publicExports.bundleFile = function LibraryBuild_bundleFile(
        config, bundleIDs,
    ) {
        const privateData = Object.assign({}, config) as PrivateData;
        if (!(config.bundleRegistry instanceof Set)) {
            privateData.bundleRegistry = new Set();
        }
        if (config.bundleAfter === false) {
            privateData.bundleAfter = returnNone;
        } else if (typeof config.bundleAfter !== "function") {
            privateData.bundleAfter = publicExports.bundlerDefaults.bundleAfter;
        }
        return bundleFileIntern(privateData, bundleIDs);
    };

    const bundleFileIntern = function LibraryBuild_bundleFileIntern(
        privateData: PrivateData,
        bundleIDs: string[],
    ): string[] {
        const { bundleRegistry, readBundleContent } = privateData;
        const result = [] as string[];
        const length = bundleIDs.length;
        let bundleID = "";
        let bundleContent: any;
        for (let i = 0; i < length; i += 1) {
            if (bundleRegistry.has(bundleIDs[i])) {
                continue;
            }

            bundleID = bundleIDs[i];
            bundleRegistry.add(bundleID);
            bundleContent = readBundleContent(bundleID);
            if (
                typeof bundleContent === "object"
                && bundleContent.neededBundleIDs instanceof Array
            ) {
                result.push(...bundleFileIntern(
                    privateData, bundleContent.neededBundleIDs
                ));
                bundleContent = bundleContent.content;
            }
            result.push(
                ...bundleContent,
                privateData.bundleAfter(bundleID),
            );
        }
        return result;
    };

    publicExports.bundlerDefaults = {
        header: '"use strict";\n\
(function Library_bundledFiles_init() {\n\
const fileCollection = new Map();\n\n\n',
        bundleAfter: function LibraryBuild_defaults_bundleAfter(bundleID) {
            return '\nfileCollection.set("' + bundleID + '", module.exports);\n\n';
        },
        footer: '\n})();'
    };



    Object.freeze(publicExports);
})();