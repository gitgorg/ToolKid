interface ToolKid_file { code: TK_Code_file }
interface TK_Code_file {
    CDW: {
        textLayerDefinition: TextLayerDefinition,
    }
}



(function TK_CodeCDW_init() {
    const publicExports = module.exports = {} as TK_Code_file["CDW"];

    publicExports.textLayerDefinition = {
        cdw_comment: {
            patterns: [["//", /\n|$/], ["/*", "*/"]],
        },
        cdw_import: {
            patterns: [["#import(", ")"]],
            layerData: { fileConnection: "insert" },
        },
        cdw_importMaybe: {
            patterns: [["#load(", ")"]],
            layerData: { fileConnection: "optional" },
        },
        cdw_insertAfter: {
            patterns: [["#insertAfter(", ")"]],
            layerData: { fileConnection: "optional" },
        },
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "CDW", entries: publicExports });
    }
})();