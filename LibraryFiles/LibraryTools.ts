//supporting functions for custom Library building
type LibraryTools_file = {
    easyExpression(
        simpleExpression: string
    ): RegExp,
    isArray(
        value: any
    ): boolean,
    isDirectory(
        path: string
    ): boolean,
    loopFiles(inputs: {
        path: string | string[],
        execute (
            path: string
        ): void,
        include?: string | string[],
        exclude?: string | string[]
    }): void,
    partial<ReturnType>(
        baseFunction: { (...inputs: any[]): ReturnType },
        presetInput: any,
        ...additionalPresetInputs: any[]
    ): { (...inputs: any[]): ReturnType },
    resolvePath(
        ...parts: string[]
    ): string,
    writeFile(inputs: {
        path: string,
        content: any,
        encoding?: "utf-8" | "base64"
    }): void
}



(function LibraryTools_init() {
    type PrivateData = {
        isIncluded(
            path: string
        ): boolean,
        execute(
            path: string
        ): void
    }



    const FS = require("fs");
    const { existsSync: isUsedPath, lstatSync: readPathStats, readdirSync: readDirectory } = FS;
    const Path = require("path");
    const { normalize, resolve: resolvePath } = Path;

    const publicExports = module.exports = <LibraryTools_file>{};

    // TODO: replacements more structured, maybe backwards compatible
    // const replacements = {
    //     "\\": "\\\\",
    //     ".": "\\.",
    //     "\*": ".+"
    // };
    publicExports.easyExpression = function LibraryTools_easyExpression(
        expression
    ) {
        expression = expression.replaceAll("\\", "\\\\");
        expression = expression.replaceAll(".", "\\.");
        expression = expression.replaceAll("\*", ".+");
        //expression = expression.replace(replaceRegex, easyExpressionReplacer);
        return new RegExp("^" + expression + "$");
    };

    // var replaceRegex = new RegExp('[' + Object.keys(replacements).join('') + ']', 'ig');
    // const easyExpressionReplacer = function (old:string) {
    //     return replacements[<".">old];
    // };

    publicExports.isArray = function LibraryTools_isArray(value) {
        return value instanceof Array && value.length !== 0;
    };

    publicExports.isDirectory = function LibraryTools_isDirectory(path) {
        return readPathStats(path).isDirectory();
    };

    const buildPathChecker = function LibraryTools_buildPathChecker(inputs: {
        include: RegExp[],
        exclude: RegExp[]
    }) {
        const hasIncludes = publicExports.isArray(inputs.include);
        const hasExcludes = publicExports.isArray(inputs.exclude);
        if (hasIncludes && hasExcludes) {
            return publicExports.partial(pathCheckerBoth, inputs.include, inputs.exclude);
        } else if (hasIncludes) {
            return publicExports.partial(pathCheckerIncludes, inputs.include);
        } else if (hasExcludes) {
            return publicExports.partial(pathCheckerExcludes, inputs.exclude);
        } else {
            return function LibraryTools_pathCheckerNone() { return true };
        }
    };
    const pathCheckerBoth = function LibraryTools_pathCheckerBoth(include: any, exclude: any, path: any) {
        const test = publicExports.partial(testPath, path);
        return exclude.find(test) === undefined && include.find(test) !== undefined
    };

    const pathCheckerIncludes = function pathCheckerIncludes(include: any, path: any) {
        const test = publicExports.partial(testPath, path);
        return include.find(test) !== undefined
    };

    const pathCheckerExcludes = function pathCheckerExcludes(exclude: any, path: any) {
        const test = publicExports.partial(testPath, path);
        return exclude.find(test) === undefined
    };

    publicExports.loopFiles = function LibraryTools_loopFiles(inputs) {
        const pathChecker = buildPathChecker({
            include: toRegExp(inputs.include || []),
            exclude: toRegExp(inputs.exclude || []),
        });
        const privateData = <PrivateData>{
            isIncluded: pathChecker,
            execute: inputs.execute
        };
        const { path } = inputs;
        if (path instanceof Array) {
            path.forEach(publicExports.partial(loopFilesFrom, privateData));
        } else {
            loopFilesFrom(privateData, path);
        }
    };

    publicExports.resolvePath = function LibraryTools_resolvePath(...parts) {
        return Path.resolve(...parts);
    };

    const loopFilesFrom = function LibraryTools_loopFilesFrom(
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

    const loopFilesFromDirectory = function LibraryTools_loopFilesFromDirectory(
        privateData: PrivateData, path: string
    ) {
        readDirectory(path).forEach(
            publicExports.partial(loopFilesExecute, privateData, path)
        );
    };

    const loopFilesExecute = function LibraryTools_loopFilesExecute(
        privateData: PrivateData, root: string, path: string
    ) {
        path = resolvePath(root, path);
        if (publicExports.isDirectory(path)) {
            loopFilesFromDirectory(privateData, path);
            return;
        }

        if (privateData.isIncluded(path)) {
            privateData.execute(path);
        }
    };

    publicExports.partial = function LibraryTools_partial(
        baseFunction, ...inputs
    ) {
        if (inputs.length === 0) {
            throw ["LibraryTools_partial - no inputs to preset for:",baseFunction];
        }

        const result = baseFunction.bind(null, ...inputs);
        if (result.presetInputs instanceof Array) {
            result.presetInputs.push(...inputs);
        } else {
            result.presetInputs = inputs
        }
        return result;
    };
    
    const testPath = function LibraryTools_testPath(
        path: string, expression: RegExp
    ) {
        return expression.test(path);
    };

    const toRegExp = function LibraryTools_toRegExp(
        expressions: string | string[]
    ) {
        if (typeof expressions === "string") {
            expressions = [expressions];
        } else if (!(expressions instanceof Array)) {
            return [];
        }

        return expressions
            .map(normalize)
            .map(publicExports.easyExpression);
    };

    const writeDirectory = function LibraryTools_writeDirectory(path: string) {
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

    publicExports.writeFile = function LibraryTools_writeFile(inputs) {
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