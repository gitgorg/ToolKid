//file operations for nodeJS
interface ToolKid_file { nodeJS: TK_nodeJS_file }
interface TK_nodeJS_file {
    deletePath(
        path: string
    ): void,
    extendFile(inputs: {
        path: string,
        content: any,
    }): void,
    isDirectory(
        path: string
    ): boolean,
    isUsedPath(
        path: string
    ): boolean,
    readDirectory(
        path: string
    ): string[],
    readFile: LibraryFiles_file["readFile"],
    readFileStats(
        path: string
    ): { size?: number }, // node js fs stat object
    resolvePath: LibraryFiles_file["resolvePath"],
    writeFile: LibraryFiles_file["writeFile"],
}



(function TK_NodeJSFile_init() {
    const {
        appendFileSync: extendFile,
        existsSync: isUsedPath,
        lstatSync: readPathStats,
        readdirSync: readDirectory,
        rmSync: deleteFolder,
        statSync: readFileStats,
        unlinkSync: deleteFile
    } = require("fs");



    const publicExports = module.exports = <TK_nodeJS_file>{};

    publicExports.deletePath = function TK_NodeJSFile_deletePath(path) {
        if (!isUsedPath(path)) {
            return;
        }

        if (publicExports.isDirectory(path)) {
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

    publicExports.isDirectory = function TK_NodeJSFile_isDirectory(path) {
        return readPathStats(path).isDirectory();
    };

    publicExports.isUsedPath = isUsedPath;

    publicExports.readDirectory = function TK_NodeJSFile_readDirectory(path) {
        if (!isUsedPath(path) || !publicExports.isDirectory(path)) {
            return [];
        } else {
            return readDirectory(path);
        }
    };

    publicExports.readFileStats = function TK_NodeJSFile_readFileStats(path) {
        try {
            return readFileStats(path);
        } catch (error: any) {
            return {};
        }
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "nodeJS", entries: publicExports });
        const core = ToolKid.getCoreModule("files");
        ToolKid.register({
            section: "nodeJS",
            entries: {
                readFile: core.readFile,
                resolvePath: core.resolvePath,
                writeFile: core.writeFile,
            }
        });
    }
})();