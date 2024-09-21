//path operations for nodeJS
interface ToolKid_file { nodeJS: TK_nodeJS_file }
interface TK_nodeJS_file {
    isDirectory(
        path: string
    ): boolean,
    isUsedPath(
        path: string
    ): boolean,
    resolvePath: LibraryTools_file["resolvePath"]
}



(function TK_nodeJSPath_init() {
    const FS = require("fs");



    const publicExports = module.exports = <TK_nodeJS_file>{};

    publicExports.isDirectory = function TK_nodeJSPath_file_isDirectory(path: string) {
        return FS.lstatSync(path).isDirectory();
    };

    publicExports.isUsedPath = function TK_nodeJSPath_file_isUsedPath(path) {
        return FS.existsSync(path);
    };

    // publicExports.resolvePath = function TK_nodeJSPath_file_resolvePath(...path) {
    //     return Path.resolve(...path);
    // };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "nodeJS", functions: publicExports });
    }
})();