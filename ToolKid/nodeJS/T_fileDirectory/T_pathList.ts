type T_pathList_file = {
    directoryMixedContents: string,
    directoryEmpty: string,
    directoryNonExisting: string,

    file: string,
    fileEmpty: string,
    fileNonExisting: string,
    fileTypeScript: string
}

(function T_pathList_init() {
    module.exports = <T_pathList_file>{
        directoryMixedContents: "ToolKid/nodeJS/T_fileDirectory",
        directoryEmpty: "ToolKid/nodeJS/T_fileDirectory/T_empty",
        directoryNonExisting: "ToolKid/nodeJS/T_nonExistant",

        file: "ToolKid/nodeJS/T_fileDirectory/T_file.json",
        fileEmpty:  "ToolKid/nodeJS/T_fileDirectory/T_empty.txt",
        fileNonExisting: "ToolKid/nodeJS/T_fileDirectory/T_nonExistant.json",
        fileTypeScript: "ToolKid/nodeJS/T_fileDirectory/T_pathList.ts"
    };
})();