//supporting functions for custom Library building
type LibraryTools_file = {
    easyExpression(
        simpleExpression: string
    ): RegExp,
    loopFiles(inputs: {
        path: string | string[],
        include?: string | string[],
        exclude?: string | string[],
        execute: (
            path: string
        ) => void
    }): void,
    writeFile(inputs: {
        path: string,
        content: any,
        encoding?: "utf-8" | "base64"
    }): void
}



(function LibraryTools_init() {
    type PrivateData = {
        isIncluded: (
            path: string
        ) => boolean,
        execute: (
            path: string
        ) => void
    }



    const FS = require("fs");
    const { existsSync: isUsedPath, lstatSync: readPathStats, readdirSync: readDirectory } = FS;
    const Path = require("path");
    const { normalize, resolve: resolvePath } = Path;

    const publicExports = module.exports = <LibraryTools_file>{};

    publicExports.easyExpression = function LibrarBuilder_easyExpression(
        expression
    ) {
        expression = expression.replaceAll("\\", "\\\\");
        expression = expression.replaceAll(".", "\\.");
        expression = expression.replaceAll("\*", ".+");
        return new RegExp("^" + expression + "$");
    };

    const isDirectory = function TK_LibraryTools_file_isDirectory(path: string) {
        return readPathStats(path).isDirectory();
    };

    const isIncluded = function LibraryTools_isIncluded(
        privateData: {
            include: RegExp[],
            exclude: RegExp[]
        },
        path: string
    ) {
        const test = testPath.bind(null, path);
        return (
            privateData.include.length === 0
            || privateData.include.find(test) !== undefined
        ) && privateData.exclude.find(test) === undefined
    };

    publicExports.loopFiles = function LibraryTools_loopFiles(inputs) {
        const pathChecker = isIncluded.bind(null, {
            include: toRegExp(inputs.include || []),
            exclude: toRegExp(inputs.exclude || []),
        });
        const privateData = <PrivateData>{
            isIncluded: pathChecker,
            execute: inputs.execute
        }
        const { path } = inputs;
        if (path instanceof Array) {
            path.forEach(loopFilesFrom.bind(null, privateData));
        } else {
            loopFilesFrom(privateData, path);
        }
    };

    const testPath = function LibraryTools_testPath(
        path: string, expression: RegExp
    ) {
        return expression.test(path);
    };

    const loopFilesFrom = function LibraryTools_loopFilesFrom(
        privateData: PrivateData, path: string
    ) {
        path = resolvePath(path);
        if (!isUsedPath(path)) {
            return;
        }

        if (isDirectory(path)) {
            loopFilesFromDirectory(privateData, path);
        } else {
            loopFilesExecute(privateData, "", path);
        }
    };

    const loopFilesFromDirectory = function LibraryTools_loopFilesFromDirectory(
        privateData: PrivateData, path: string
    ) {
        readDirectory(path)
            .forEach(loopFilesExecute.bind(null, privateData, path));
    };

    const loopFilesExecute = function LibraryTools_loopFilesExecute(
        privateData: PrivateData, root: string, path: string
    ) {
        path = resolvePath(root, path);
        if (isDirectory(path)) {
            loopFilesFromDirectory(privateData, path);
            return;
        }

        if (privateData.isIncluded(path)) {
            privateData.execute(path);
        }
    };

    const toRegExp = function (
        expressionList: string | string[]
    ) {
        if (typeof expressionList === "string") {
            expressionList = [expressionList];
        } else if (!(expressionList instanceof Array)) {
            return [];
        }

        return expressionList
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

})();