//path operations for nodeJS
interface ToolKid_file { nodeJS: TK_nodeJS_file }
interface TK_nodeJS_file {
    isDirectory: LibraryTools_file["isDirectory"],
    isUsedPath(
        path: string
    ): boolean,
    readFileName: LibraryTools_file["readFileName"],
    resolvePath: LibraryTools_file["resolvePath"]
}



(function TK_nodeJSPath_init() {
    const FS = require("fs");



    const publicExports = module.exports = <TK_nodeJS_file>{};

    publicExports.isUsedPath = function TK_nodeJSPath_file_isUsedPath(path) {
        return FS.existsSync(path);
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunctions({ section: "nodeJS", functions: publicExports });
    }
})();