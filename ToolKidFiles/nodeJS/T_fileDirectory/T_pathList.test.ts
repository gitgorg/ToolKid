type T_pathList_test = {
    directoryMixedContents: string,
    directoryEmpty: string,
    directoryNonExisting: string,

    file: string,
    fileEmpty: string,
    fileNonExisting: string,
    fileTypeScript: string
}

(function T_pathList_test() {
    const FS = require("fs");



    const root = __dirname.slice(0,-15);
    const publicExports = module.exports = <T_pathList_test>{
        directoryMixedContents: root + "T_fileDirectory",
        directoryEmpty: root + "T_fileDirectory/T_empty",
        directoryNonExisting: root + "T_nonExistant",

        file: root + "T_fileDirectory/T_file.json",
        fileEmpty:  root + "T_fileDirectory/T_empty.txt",
        fileNonExisting: root + "T_fileDirectory/T_nonExistant.json",
        fileTypeScript: root + "T_fileDirectory/T_pathList.test.js"
    };

    if (!FS.existsSync(publicExports.directoryEmpty)) {
        FS.mkdirSync(publicExports.directoryEmpty);
    }
    FS.writeFileSync(publicExports.fileEmpty,"");
    FS.writeFileSync(publicExports.file,
"{\
    \"text\": \"hello\",\
    \"number\": 1\
}"
    );
})();