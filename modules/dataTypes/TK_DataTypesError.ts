//general automated testing
interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { error: TK_DataTypesError_file }
type TK_DataTypesError_file = {
    createCustomError: LibraryCore_file["createCustomError"],
}
interface NodeRequire {
    (path: "TK_DataTypesError.js"): TK_DataTypesError_file
}



(function TK_DataTypesError_init() {
    const publicExports = module.exports = <TK_DataTypesError_file>{};

    publicExports.createCustomError = ToolKid.getCoreModule("core").createCustomError;



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "dataTypes", subSection: "error", entries: publicExports });
    }
})();