//file operations for nodeJS
interface ToolKid_file { file: TK_file_file }
interface TK_file_file {
    getExtension(
        path: string
    ): string,
    getName(
        path: string
    ): string,
    loopFiles: LibraryFiles_file["loopFiles"],
    register(
        path: string
    ): void,
    registerDependencies(
        fileName: string, ...dependencies: string[]
    ): void,
}



(function TK_File_init() {
    const { createSimpleRX, createStringChecker } = ToolKid.getCoreModule("regularExpression");
    const fileRegistry = new Map() as Map<string, string>;
    const publicExports = module.exports = <TK_file_file>{};



    const basePathRX = /^\.{0,1}\/{0,1}/;
    const createPathRX = function (path: string): RegExp {
        return new RegExp("^" + path.replace(basePathRX, ""));
    };

    publicExports.getExtension = function TK_File_getExtension(path) {
        const parts = publicExports.getName(path).split(".");
        return (parts.length === 1)
            ? ""
            : parts[parts.length - 1].toLocaleLowerCase();
    };

    publicExports.getName = function TK_File_getName(path) {
        let parts = path.trim().split(/\/|\\/);
        return parts[parts.length - 1];
    };

    if (typeof Element !== "undefined") {
        publicExports.loopFiles = function TK_File_loopFiles(inputs) {
            const { includes, excludes, execute } = <Dictionary>inputs;
            if (includes instanceof Array) {
                includes.forEach(function (pattern, index) {
                    if (typeof pattern === "string") {
                        includes[index] = createSimpleRX(pattern);
                    }
                });
            }
            if (excludes instanceof Array) {
                excludes.forEach(function (pattern, index) {
                    if (typeof pattern === "string") {
                        excludes[index] = createSimpleRX(pattern);
                    }
                });
            }
            const pathRX = (inputs.path instanceof Array)
                ? new RegExp(inputs.path.map(createPathRX).join("|"))
                : createPathRX(inputs.path);
            const checkExtra = createStringChecker({ includes, excludes });
            fileRegistry.forEach(function TK_File_loopFilesPath(path) {
                if (pathRX.test(path) && checkExtra(path)) {
                    execute(path);
                }
            });
        }
    };

    publicExports.register = function TK_File_register(path) {
        const fileName = publicExports.getName(path);
        const registeredPath = fileRegistry.get(fileName);
        if (registeredPath === path) {
            return;
        } else if (registeredPath === undefined) {
            fileRegistry.set(fileName, path);
        } else {
            throw [
                "TK_File_register - fileName allready in use: ", fileName,
                " paths are: ", fileRegistry.get(fileName), path
            ];
        }
    };



    if (typeof ToolKid !== "undefined") {
        if (typeof Element === "undefined") {
            publicExports.loopFiles = ToolKid.getCoreModule("files").loopFiles;
        }
        ToolKid.register({ section: "file", entries: publicExports });
    }
    Object.freeze(publicExports);
})();