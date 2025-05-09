//file operations for nodeJS
interface ToolKid_file { nodeJS: TK_nodeJS_file }
interface TK_nodeJS_file {
    deleteFile(
        path: string
    ): void
    deleteFile(inputs: {
        path: string,
        ignoreMissingFile?: true,
    }): void,
    extendFile(inputs: {
        path: string,
        content: any,
    }): void,
    loopFiles: LibraryTools_file["loopFiles"],
    readFile: LibraryTools_file["readFile"],
    writeFile: LibraryTools_file["writeFile"]
}



(function TK_nodeJSFile_init() {
    const {
        appendFileSync: extendFile,
        existsSync: isUsedPath,
        rmSync: deleteFolder,
        unlinkSync: deleteFile
    } = require("fs");



    const publicExports = module.exports = <TK_nodeJS_file>{};

    publicExports.deleteFile = function TK_nodeJSFile_deleteFile(inputs) {
        if (typeof inputs === "string") {
            inputs = { path: inputs };
        }
        if (!isUsedPath(inputs.path)) {
            return;
        }

        if (ToolKid.nodeJS.isDirectory(inputs.path)) {
            deleteFolder(inputs.path, { recursive: true });
        } else {
            deleteFile(inputs.path);
        }
    };

    publicExports.extendFile = function TK_nodeJSFile_extendFile(inputs) {
        if (isUsedPath(inputs.path)) {
            extendFile(inputs.path, inputs.content);
        } else {
            ToolKid.nodeJS.writeFile(inputs);
        }
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunctions({ section: "nodeJS", functions: publicExports });
    }
})();