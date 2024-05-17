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
    const root = "ToolKidFiles/nodeJS/";
    module.exports = <T_pathList_file>{
        directoryMixedContents: root + "T_fileDirectory",
        directoryEmpty: root + "T_fileDirectory/T_empty",
        directoryNonExisting: root + "T_nonExistant",

        file: root + "T_fileDirectory/T_file.json",
        fileEmpty:  root + "T_fileDirectory/T_empty.txt",
        fileNonExisting: root + "T_fileDirectory/T_nonExistant.json",
        fileTypeScript: root + "T_fileDirectory/T_pathList.ts"
    };
})();