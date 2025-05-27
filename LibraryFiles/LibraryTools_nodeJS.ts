//supporting functions for custom Library building
interface LibraryTools_file {
    isDirectory(
        path: string
    ): boolean,
}



(function LibraryTools_nodeJS_init() {
    const FS = require("fs");
    const Path = require("path");

    const {
        existsSync: isUsedPath,
    } = require("fs");
    const { resolve: resolvePath } = require("path");

    const isCalledFromLibrary = (Path.basename(__dirname) === "LibraryFiles");
    const LibraryTools = isCalledFromLibrary
        ? <LibraryTools_file>require(
            resolvePath(__dirname, "./LibraryTools.js")
        )
        //@ts-ignore
        : registeredFiles["LibraryTools.js"];

    const { lstatSync: readPathStats } = FS;



    const publicExports = module.exports = <LibraryTools_file>Object.assign({}, LibraryTools);

    publicExports.isDirectory = function LibraryTools_nodeJS_isDirectory(path) {
        return readPathStats(path).isDirectory();
    };



    Object.freeze(publicExports);
})();