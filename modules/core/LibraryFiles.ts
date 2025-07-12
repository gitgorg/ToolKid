interface LibraryCore_file {
    getCoreModule(name: "files"): LibraryFiles_file
}

type LibraryFiles_file = {
    createPathChecker(inputs: {
        includes?: (string | RegExp)[],
        excludes?: (string | RegExp)[],
    }): { (path: string): boolean },
    loopFiles(inputs: {
        path: string | string[],
        execute(
            path: string
        ): void,
    } & ({
        includes?: (string | RegExp)[],
        excludes?: (string | RegExp)[],
    } | {
        pathChecker: ReturnType<LibraryFiles_file["createPathChecker"]>
    })): void,
    readFile(
        path: string | {
            path: string,
            checkExistance?: false,
            encoding?: string,
            useCache?: false,
        }
    ): {
        encoding: string,
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
    }): void | Error,
}



(function LibraryFiles_init() {
    type DataForLooping = {
        isIncluded(
            path: string
        ): boolean,
        execute(
            path: string
        ): void
    }



    const {
        existsSync: isUsedPath,
        mkdirSync: createDirectory,
        lstatSync: readPathStats,
        readdirSync: readDirectory,
        readFileSync: readFile,
        writeFileSync: createFile,
    } = require("fs");
    const {
        dirname: directoryName,
        normalize: normalizePath,
        resolve: resolvePath,
    } = require("path");



    let { createSimpleRX, createStringChecker } = <LibraryRegularExpression_file>{};
    const publicExports = module.exports = <LibraryFiles_file><any>function LibraryFiles_setup(core: LibraryCore_file) {
        ({ createSimpleRX, createStringChecker } = core.getCoreModule("regularExpression"));
    };

    const collectPaths = function LibraryFiles_collectPaths(
        expressions: (string | RegExp)[] | undefined
    ): RegExp[] {
        if (!(expressions instanceof Array)) {
            return [];
        }

        const result = <RegExp[]>[];
        expressions.map(collectPathsFilter.bind(null, result));
        return result;
    };

    const collectPathsFilter = function LibraryFiles_collectPathsFilter(
        validated: RegExp[], expression: any
    ) {
        if (typeof expression === "string") {
            validated.push(createSimpleRX({
                pattern: normalizePath(expression),
                isFromStartToEnd: true,
            }));
        } else if (expression instanceof RegExp) {
            validated.push(expression);
        }
    };

    publicExports.createPathChecker = function (inputs) {
        return createStringChecker({
            includes: collectPaths(inputs.includes),
            excludes: collectPaths(inputs.excludes),
        });
    };

    const isDirectory = function LibraryFiles_isDirectory(path: string) {
        return readPathStats(path).isDirectory();
    };

    publicExports.loopFiles = function LibraryFiles_loopFiles(
        inputs:Dictionary
    ) {
        const DataForLooping = {
            isIncluded: inputs.pathChecker || publicExports.createPathChecker(inputs),
            execute: inputs.execute,
        };
        const { path } = inputs;
        if (path instanceof Array) {
            path.forEach(loopFilesFrom.bind(null, DataForLooping));
        } else {
            loopFilesFrom(DataForLooping, path);
        }
    };

    const loopFilesFrom = function LibraryFiles_loopFilesFrom(
        DataForLooping: DataForLooping,
        path: string
    ) {
        path = resolvePath(path);
        if (!isUsedPath(path)) {
            throw ["LibraryFiles_loopFiles - no such path exists:", path];
        }

        if (isDirectory(path)) {
            loopFilesFromDirectory(DataForLooping, path);
        } else {
            loopFilesExecute(DataForLooping, "", path);
        }
    };

    const loopFilesFromDirectory = function LibraryFiles_loopFilesFromDirectory(
        DataForLooping: DataForLooping, path: string
    ) {
        readDirectory(path).forEach(
            loopFilesExecute.bind(null, DataForLooping, path)
        );
    };

    const loopFilesExecute = function LibraryFiles_loopFilesExecute(
        boundInputs: DataForLooping, root: string, path: string
    ) {
        path = resolvePath(root, path);
        if (isDirectory(path)) {
            loopFilesFromDirectory(boundInputs, path);
            return;
        }

        if (boundInputs.isIncluded(path)) {
            boundInputs.execute(path);
        }
    };

    publicExports.readFile = function LibraryFiles_readFile(inputs) {
        if (typeof inputs === "string") {
            inputs = { path: inputs };
        }
        let path = resolvePath(inputs.path);
        if (inputs.checkExistance !== false) {
            if (!isUsedPath(path)) {
                return { content: undefined };
            } else if (isDirectory(path)) {
                throw ["LibraryFiles_readFile - path is a directory, not a file:", path];
            }
        }

        let { encoding } = inputs;
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

    publicExports.resolvePath = resolvePath;

    const writeDirectory = function LibraryFiles_writeDirectory(path: string) {
        if (isUsedPath(path)) {
            return;
        }

        const rootPath = directoryName(path);
        if (!isUsedPath(rootPath)) {
            writeDirectory(rootPath);
        }
        try {
            createDirectory(path);
        } catch (err) {
            console.warn(err);
        }
    };

    publicExports.writeFile = function LibraryFiles_writeFile(inputs) {
        const path = resolvePath(inputs.path);
        writeDirectory(directoryName(path));
        try {
            createFile(
                inputs.path,
                inputs.content,
                { encoding: inputs.encoding }
            );
        } catch (error) {
            console.error(["LibraryFiles_writeFile failed - path:", path, "content:", inputs.content, "encoding:", inputs.encoding, "error:", error]);
            return error;
        }
    };



    Object.freeze(publicExports);
})();