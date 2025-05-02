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
    readFile(inputs: {
        path: string,
        checkExistance?: false,
        encoding?: string,
    }): {
        encoding: "directory" | string,
        content: any
    } | {
        content: undefined
    },
    writeFile: LibraryTools_file["writeFile"]
}



(function TK_nodeJSFile_init() {
    const {
        appendFileSync: extendFile,
        existsSync: isUsedPath,
        readFileSync: readFile,
        rmSync: deleteFolder,
        unlinkSync: deleteFile
    } = require("fs");
    const { resolve: resolvePath } = require("path");



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

    publicExports.readFile = function TK_nodeJSFile_read(inputs) {
        let { path, checkExistance, encoding } = inputs;
        path = resolvePath(path);
        if (checkExistance !== false) {
            if (!isUsedPath(path)) {
                return { content: undefined };
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