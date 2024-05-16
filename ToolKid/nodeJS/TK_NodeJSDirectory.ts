//directory operations for nodeJS
interface ToolKid_file { nodeJS: TK_nodeJS_file }
interface TK_nodeJS_file {
    loopDirectory(inputs: {
        path: string | string[],
        execute(inputs: {
            isDirectory: boolean,
            name: string,
            root: string,
            path: string
        }): void
    }): void,
    readDirectory(
        path: string
    ): string[],
}



(function TK_nodeJSDirectory_init() {
    const {
        readdirSync: readDirectory,
        existsSync: isUsedPath
    } = require("fs");
    const { resolve: resolvePath } = require("path");



    const publicExports = module.exports = <TK_nodeJS_file>{};

    publicExports.loopDirectory = function TK_nodeJSDirectory_loopDirectorySetup(inputs) {
        const { path } = inputs;
        if (path instanceof Array) {
            path.forEach(
                loopDirectoryLayer.bind(null, inputs.execute)
            );
        } else {
            loopDirectoryLayer(inputs.execute, path);
        }
    };

    const loopDirectoryLayer = function TK_nodeJSDirectory_loopDirectoryLayer(
        execute: (inputs: {
            name: string, root: string, path: string, isDirectory: boolean
        }) => void,
        root: string
    ) {
        const files = publicExports.readDirectory(root);
        let isDir: boolean;
        let path: string;
        const { isDirectory } = ToolKid.nodeJS;
        files.forEach(function (name) {
            path = resolvePath(root, name);
            isDir = isDirectory(path);
            execute({
                name, root, path, isDirectory: isDir
            });
            if (isDir) {
                loopDirectoryLayer(execute, path);
            }
        });
    };

    publicExports.readDirectory = function TK_nodeJSDirectory_readDirectory(path) {
        path = resolvePath(path);
        if (!isUsedPath(path)) {
            return [];
        } else if (!ToolKid.nodeJS.isDirectory(path)) {
            throw ["TK_nodeJSDirectory_read - path is a file, not a directory:", path];
        }

        return readDirectory(path);
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "nodeJS", functions: publicExports });
    }
})();