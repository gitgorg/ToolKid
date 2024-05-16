//file operations for nodeJS
interface ToolKid_file { nodeJS: TK_nodeJS_file }
interface TK_nodeJS_file {
    readFile(inputs: {
        path: string,

        checkExistance?: false,
        encoding?: string
    }): {
        encoding: "directory" | string,
        content: any
    } | undefined,
}



(function TK_nodeJSFile_init() {
    const {
        existsSync: isUsedPath,
        readFileSync: readFile
    } = require("fs");
    const { resolve: resolvePath } = require("path");



    const publicExports = module.exports = <TK_nodeJS_file>{};

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
            const type = ToolKid.web.readMediaType(<string>path);
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