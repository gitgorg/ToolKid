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

    bundleFile(inputs: {
        bundleIDs: string[],
        readBundleContent: (
            bundleID: string
        ) => string[] | BundleContent,
        bundleRegistry?: Set<string>,
        bundleAfter?: LibraryBuild_file["bundlerDefaults"]["bundleAfter"] | false,
    }): string[],
}

type BundleContent = {
    content: string[],
    neededBundleIDs?: string[],
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
    publicExports.bundleFile = function LibraryBuild_bundleFile(inputs) {
        const privateData = Object.assign({}, inputs) as PrivateData;
        //@ts-ignore
        delete privateData.bundleIDs;
        if (!(inputs.bundleRegistry instanceof Set)) {
            privateData.bundleRegistry = new Set();
        }
        if (inputs.bundleAfter === false) {
            privateData.bundleAfter = returnNone;
        } else if (typeof inputs.bundleAfter !== "function") {
            privateData.bundleAfter = publicExports.bundlerDefaults.bundleAfter;
        }
        return bundleFileIntern(privateData, inputs.bundleIDs);
    };

    const bundleFileIntern = function LibraryBuild_bundleFileIntern(
        privateData: PrivateData,
        bundleIDs: string[],
    ): string[] {
        const { bundleRegistry, readBundleContent } = privateData;
        const result = [] as string[];
        const length = bundleIDs.length;
        let bundleID = "";
        let bundleContent: string[] | BundleContent;
        for (let i = 0; i < length; i += 1) {
            if (bundleRegistry.has(bundleIDs[i])) {
                continue;
            }

            bundleID = bundleIDs[i];
            bundleRegistry.add(bundleID);
            bundleContent = readBundleContent(bundleID);
            if (bundleContent instanceof Array) {
                result.push(
                    ...bundleContent,
                    privateData.bundleAfter(bundleID),
                );
                continue;
            }

            if (bundleContent.neededBundleIDs instanceof Array) {
                result.push(...bundleFileIntern(
                    privateData, bundleContent.neededBundleIDs
                ));
            }
            result.push(
                ...bundleContent.content,
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