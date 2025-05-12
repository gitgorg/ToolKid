//supporting functions for custom Library building
interface LibraryTools_file {
    isDirectory(
        path: string
    ): boolean,
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
    resolvePath(
        ...parts: string[]
    ): string,
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
        readFileSync: readFile,
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

    publicExports.readFile = function LibraryTools_nodeJS_read(inputs) {
        let { path, checkExistance, encoding } = inputs;
        path = resolvePath(path);
        if (checkExistance !== false) {
            if (!isUsedPath(path)) {
                return { content: undefined };
            } else if (ToolKid.nodeJS.isDirectory(path)) {
                throw ["LibraryTools_nodeJS_read - path is a directory, not a file:", path];
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

    publicExports.resolvePath = function LibraryTools_nodeJS_resolvePath(...parts) {
        return Path.resolve(...parts);
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