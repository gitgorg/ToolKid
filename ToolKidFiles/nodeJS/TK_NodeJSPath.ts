//path operations for nodeJS
interface ToolKid_file { nodeJS: TK_nodeJS_file }
interface TK_nodeJS_file {
    isDirectory(
        path: string
    ): boolean,
}

(function TK_NodeJSPath_init(){
    const { lstatSync: readPathStats } = require("fs");



    const publicExports = module.exports = <TK_nodeJS_file>{};
    publicExports.isDirectory = function TK_NodeJSPath_isDirectory(path) {
        return readPathStats(path).isDirectory();
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunctions({ section: "nodeJS", functions: publicExports });
    }
})();