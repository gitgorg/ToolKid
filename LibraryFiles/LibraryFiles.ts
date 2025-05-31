interface LibraryCore_file {
    getCoreModule(name: "files"): LibraryFiles_file
}

type LibraryFiles_file = {
    createStringChecker(inputs: {
        includes?: RegExp[],
        excludes?: RegExp[]
    }): { (value: string): boolean },
    loopFiles(inputs: {
        path: string | string[],
        execute(
            path: string
        ): void,
        includes?: (string | RegExp)[],
        excludes?: (string | RegExp)[],
    }): void,
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
    }): void,
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



    const publicExports = module.exports = <LibraryFiles_file>{};

    const checkString = function LibraryFiles_checkString(
        value: string, expression: RegExp
    ) {
        return expression.test(value);
    };

    const checkStringConditions = function LibraryFiles_checkStringConditions(
        conditions: {
            includes: RegExp[], excludes: RegExp[]
        },
        value: string
    ) {
        const test = checkString.bind(null, value);
        return conditions.includes.find(test) !== undefined
            && conditions.excludes.find(test) === undefined;
    };

    const checkStringExclusion = function checkStringExclusion(
        exclude: RegExp[], value: string
    ) {
        const test = checkString.bind(null, value);
        return exclude.find(test) === undefined;
    };

    const checkStringInclusion = function checkStringInclusion(
        include: RegExp[], value: string
    ) {
        const test = checkString.bind(null, value);
        return include.find(test) !== undefined;
    };

    // TODO: replacements more structured, maybe backwards compatible
    // const replacements = {
    //     "\\": "\\\\",
    //     ".": "\\.",
    //     "\*": ".+"
    // };
    const createSimpleRegxp = function LibraryFiles_createSimpleRegxp(
        expression: string
    ) {
        expression = expression.replaceAll("\\", "\\\\");
        expression = expression.replaceAll(".", "\\.");
        expression = expression.replaceAll("\*", ".+");
        //expression = expression.replace(replaceRegex, createSimpleRegxpReplacer);
        return new RegExp("^" + expression + "$");
    };

    publicExports.createStringChecker = function LibraryFiles_createStringChecker(inputs): any {
        const hasIncludes = isArray(inputs.includes);
        const hasExcludes = isArray(inputs.excludes);
        if (hasIncludes && hasExcludes) {
            return checkStringConditions.bind(null, inputs);
        } else if (hasIncludes) {
            return checkStringInclusion.bind(null, inputs.includes);
        } else if (hasExcludes) {
            return checkStringExclusion.bind(null, inputs.excludes);
        } else {
            return function LibraryFiles_checkNothing() { return true };
        }
    };

    const isArray = function LibraryFiles_isArray(value: any) {
        return value instanceof Array && value.length !== 0;
    };

    const isDirectory = function LibraryFiles_isDirectory(path: string) {
        return readPathStats(path).isDirectory();
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
            validated.push(createSimpleRegxp(normalizePath(expression)));
        } else if (expression instanceof RegExp) {
            validated.push(expression);
        }
    };

    publicExports.loopFiles = function LibraryFiles_loopFiles(inputs) {
        const checker = publicExports.createStringChecker({
            includes: collectPaths(inputs.includes),
            excludes: collectPaths(inputs.excludes),
        });
        const DataForLooping = {
            isIncluded: checker,
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
        let { path, checkExistance, encoding } = inputs;
        path = resolvePath(path);
        if (checkExistance !== false) {
            if (!isUsedPath(path)) {
                return { content: undefined };
            } else if (isDirectory(path)) {
                throw ["LibraryFiles_readFile - path is a directory, not a file:", path];
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
        createFile(
            inputs.path,
            inputs.content,
            { encoding: inputs.encoding }
        );
    };



    Object.freeze(publicExports);
})();