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
}



(function TK_File_init() {
    const publicExports = module.exports = <TK_file_file>{};

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
            // log(2345, inputs);
        }
    }



    if (typeof ToolKid !== "undefined") {
        if (typeof Element === "undefined") {
            publicExports.loopFiles = ToolKid.getCoreModule("files").loopFiles;
        }
        ToolKid.register({ section: "file", entries: publicExports });
    }
    Object.freeze(publicExports);
})();