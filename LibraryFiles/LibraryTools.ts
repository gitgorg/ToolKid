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
        include?: string | string[],
        exclude?: string | string[],
        execute: (
            path: string
        ) => void
    }): void,
    preset<T>(
        baseFunction: { (...inputs: any[]): T },
        ...appliedInputs: any[]
    ): { (...inputs: any[]): T }
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

    const isArray = publicExports.isArray = function LibraryTools_isArray(value) {
        return value instanceof Array && value.length !== 0;
    };

    const isDirectory = publicExports.isDirectory = function LibraryTools_isDirectory(path) {
        return readPathStats(path).isDirectory();
    };

    const buildPathChecker = function (inputs: {
        include: RegExp[],
        exclude: RegExp[]
    },) {
        const hasIncludes = isArray(inputs.include);
        const hasExcludes = isArray(inputs.exclude);
        if (hasIncludes && hasExcludes) {
            return preset(pathCheckerBoth, inputs.include, inputs.exclude);
        } else if (hasIncludes) {
            return preset(pathCheckerIncludes, inputs.include);
        } else if(hasExcludes){
            return preset(pathCheckerExcludes, inputs.exclude);
        } else {
            return function(){return true};
        }
    };
    const pathCheckerBoth = function(include:any, exclude:any, path:any){
        const test = preset(testPath, path);
        return exclude.find(test) === undefined && include.find(test) !== undefined
    };

    const pathCheckerIncludes = function(include:any, path:any){
        const test = preset(testPath, path);
        return include.find(test) !== undefined
    };

    const pathCheckerExcludes = function(exclude:any, path:any){
        const test = preset(testPath, path);
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
            path.forEach(preset(loopFilesFrom, privateData));
        } else {
            loopFilesFrom(privateData, path);
        }
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
            .forEach(preset(loopFilesExecute, privateData, path));
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

    publicExports.preset = function LibraryTools_preset(
        baseFunction, ...inputs
    ) {
        return baseFunction.bind(null, ...inputs);
    };
    const preset = publicExports.preset;

    const testPath = function LibraryTools_testPath(
        path: string, expression: RegExp
    ) {
        return expression.test(path);
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