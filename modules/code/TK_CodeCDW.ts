interface ToolKid_file { code: TK_Code_file }
interface TK_Code_file { CDW: TK_CodeCDW_file }
type TK_CodeCDW_file = {
    textLayerDefinition: TextLayerDefinition,
}



(function TK_CodeCDW_init() {
    const publicExports = module.exports = {} as TK_CodeJS_file;

    publicExports.textLayerDefinition = {
        cdw_comment: {
            patterns: [["//", /\n|$/], ["/*", "*/"]],
        },
        cdw_import: {
            patterns: [["#import(", ")"]],
        },
        cdw_importMaybe: {
            patterns: [["#load(", ")"]],
        },
        cdw_insertAfter: {
            patterns: [["#insertAfter(", ")"]],
        },
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "CDW", entries: publicExports });
    }
})();