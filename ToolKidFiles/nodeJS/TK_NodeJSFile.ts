//file operations for nodeJS
interface ToolKid_file { nodeJS: TK_nodeJS_file }
interface TK_nodeJS_file {
    loopFiles: LibraryFiles_file["loopFiles"],
    readFile: LibraryTools_file["readFile"],
    writeFile: LibraryTools_file["writeFile"],

    deleteFile(path: string): void,
    extendFile(inputs: {
        path: string,
        content: any,
    }): void,
}



(function TK_NodeJSFile_init() {
    const {
        appendFileSync: extendFile,
        existsSync: isUsedPath,
        rmSync: deleteFolder,
        unlinkSync: deleteFile
    } = require("fs");



    const publicExports = module.exports = <TK_nodeJS_file>{};

    publicExports.deleteFile = function TK_NodeJSFile_deleteFile(path) {
        if (!isUsedPath(path)) {
            return;
        }

        if (ToolKid.nodeJS.isDirectory(path)) {
            deleteFolder(path, { recursive: true });
        } else {
            deleteFile(path);
        }
    };

    publicExports.extendFile = function TK_NodeJSFile_extendFile(inputs) {
        if (isUsedPath(inputs.path)) {
            extendFile(inputs.path, inputs.content);
        } else {
            ToolKid.nodeJS.writeFile(inputs);
        }
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunctions({ section: "nodeJS", functions: publicExports });
        const { loopFiles } = ToolKid.getCoreModule("files");
        ToolKid.registerFunctions({ section: "nodeJS", functions: { loopFiles } });
    }
})();