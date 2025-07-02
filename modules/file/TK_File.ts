//file operations for nodeJS
interface ToolKid_file { file: TK_file_file }
interface TK_file_file {
    getExtension(filePath:string): string
}



(function TK_File_init() {
    const publicExports = module.exports = <TK_file_file>{};

    publicExports.getExtension = function TK_File_getExtension(filePath) {
        let parts = filePath.trim().split(/\/|\\/);
        const fileName = parts[parts.length -1];
        parts = fileName.split(".");
        return (parts.length === 1)
            ? ""
            : parts[parts.length-1].toLocaleLowerCase();
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "file", entries: publicExports });
    }
})();