//supporting functions for custom Library building
interface LibraryTools_file {
    isDirectory(
        path: string
    ): boolean,
    writeFile(inputs: {
        path: string,
        content: any,
        encoding?: "utf-8" | "base64"
    }): void
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

    const writeDirectory = function LibraryTools_nodeJS_writeDirectory(path: string) {
        if (isUsedPath(path)) {
            return;
        }

        const rootPath = Path.dirname(path);
        if (!isUsedPath(rootPath)) {
            writeDirectory(rootPath);
        }
        try {
            FS.mkdirSync(path);
        } catch (err) {
            console.warn(err);
        }
    };

    publicExports.writeFile = function LibraryTools_nodeJS_writeFile(inputs) {
        const path = resolvePath(inputs.path);
        writeDirectory(Path.dirname(path));
        FS.writeFileSync(
            inputs.path,
            inputs.content,
            { encoding: inputs.encoding }
        );
    };

    Object.freeze(publicExports);
})();