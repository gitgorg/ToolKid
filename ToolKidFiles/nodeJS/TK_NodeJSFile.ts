//file operations for nodeJS
interface ToolKid_file { nodeJS: TK_nodeJS_file }
interface TK_nodeJS_file {
    deleteFile(
        path: string
    ): void
    deleteFile(inputs: {
        path: string,
        ignoreMissingFile?: true
    }): void,
    loopFiles: LibraryTools_file["loopFiles"],
    readFile(inputs: {
        path: string,

        checkExistance?: false,
        encoding?: string
    }): {
        encoding: "directory" | string,
        content: any
    } | undefined,
    writeFile: LibraryTools_file["writeFile"]
}



(function TK_nodeJSFile_init() {
    const {
        existsSync: isUsedPath,
        readFileSync: readFile,
        unlink: deleteFile
    } = require("fs");
    const { resolve: resolvePath } = require("path");



    const publicExports = module.exports = <TK_nodeJS_file>{};

    publicExports.deleteFile = function TK_nodeJSFile_deleteFile(inputs) {
        if (typeof inputs === "string") {
            inputs = { path: inputs };
        }
        deleteFile(inputs.path, deleteFileHandler.bind(null, inputs));
    };

    const deleteFileHandler = function TK_nodeJSFile_deleteFileHandler(
        boundInputs: {
            ignoreMissingFile?: true
        },
        error: Error
    ) {
        if (error !== null) {
            if (
                (<Dictionary>error).code !== "ENOENT"
                || boundInputs.ignoreMissingFile !== true
            ) {
                throw error;
            }
        }
    };

    publicExports.readFile = function TK_nodeJSFile_read(inputs) {
        let { path, checkExistance, encoding } = inputs;
        path = resolvePath(path);
        if (checkExistance !== false) {
            if (!isUsedPath(path)) {
                return undefined;
            } else if (ToolKid.nodeJS.isDirectory(path)) {
                throw ["TK_nodeJSFile_read - path is a directory, not a file:", path];
            }
        }

        if (typeof encoding !== "string") {
            const type = ToolKid.connection.HTTP.readMediaType(<string>path);
            if (type === undefined || type === "application/json" || type.slice(0, 5) === "text/") {
                encoding = "utf8";
            }
        }

        return {
            encoding: encoding || "dictionary",
            content: readFile(path, encoding)
        };
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "nodeJS", functions: publicExports });
    }
})();