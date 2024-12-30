//supporting functions for custom Library building
interface LibraryTools_file {
    isDirectory(
        path: string
    ): boolean,
    loopFiles(inputs: {
        path: string | string[],
        execute(
            path: string
        ): void,
        include?: string | string[],
        exclude?: string | string[]
    }): void,
    readFileName(
        path: string
    ): string,
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
    type PrivateData = {
        isIncluded(
            path: string
        ): boolean,
        execute(
            path: string
        ): void
    }



    const FS = require("fs");
    const Path = require("path");
    const LibraryTools = <LibraryTools_file>require(
        Path.resolve(__dirname, "LibraryTools.js")
    );

    const { createSimpleRegxp } = LibraryTools;
    const { existsSync: isUsedPath, lstatSync: readPathStats, readdirSync: readDirectory } = FS;
    const { normalize, resolve: resolvePath } = Path;



    const publicExports = module.exports = <LibraryTools_file>Object.assign({}, LibraryTools);

    publicExports.isDirectory = function LibraryTools_nodeJS_isDirectory(path) {
        return readPathStats(path).isDirectory();
    };

    const listPaths = function LibraryTools_nodeJS_listPaths(
        expressions: string | string[] | any
    ): string[] {
        if (typeof expressions === "string") {
            expressions = [expressions];
        } else if (!(expressions instanceof Array)) {
            return [];
        }

        return expressions.map(normalize);
    };

    publicExports.loopFiles = function LibraryTools_nodeJS_loopFiles(inputs) {
        const pathCheck = publicExports.createStringCheck({
            include: listPaths(inputs.include).map(createSimpleRegxp),
            exclude: listPaths(inputs.exclude).map(createSimpleRegxp),
        });
        const privateData = <PrivateData>{
            isIncluded: pathCheck,
            execute: inputs.execute
        };
        const { path } = inputs;
        if (path instanceof Array) {
            path.forEach(publicExports.partial(loopFilesFrom, privateData));
        } else {
            loopFilesFrom(privateData, path);
        }
    };

    const loopFilesFrom = function LibraryTools_nodeJS_loopFilesFrom(
        privateData: PrivateData, path: string
    ) {
        path = resolvePath(path);
        if (!isUsedPath(path)) {
            return;
        }

        if (publicExports.isDirectory(path)) {
            loopFilesFromDirectory(privateData, path);
        } else {
            loopFilesExecute(privateData, "", path);
        }
    };

    const loopFilesFromDirectory = function LibraryTools_nodeJS_loopFilesFromDirectory(
        privateData: PrivateData, path: string
    ) {
        readDirectory(path).forEach(
            publicExports.partial(loopFilesExecute, privateData, path)
        );
    };

    const loopFilesExecute = function LibraryTools_nodeJS_loopFilesExecute(
        boundInputs: PrivateData, root: string, path: string
    ) {
        path = resolvePath(root, path);
        if (publicExports.isDirectory(path)) {
            loopFilesFromDirectory(boundInputs, path);
            return;
        }

        if (boundInputs.isIncluded(path)) {
            boundInputs.execute(path);
        }
    };

    publicExports.readFileName = function LibraryTools_nodeJS_readFileName(path) {
        if (typeof path !== "string" || path === "") {
            throw ["LibraryTools_nodeJS_readFileName - invalid path argument:", path];
        }
        return Path.basename(path);
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