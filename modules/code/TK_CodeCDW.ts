interface ToolKid_file { code: TK_Code_file }
interface TK_Code_file {
    CDW: {
        textLayerDefinition: TextLayerDefinition,
    }
}



(function TK_CodeCDW_init() {
    const { readLayerContent } = ToolKid.getCoreModule("parsing");



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
            layerData: {
                fileConnection: "optional",
                readLayerContent: function TK_CodeCDW_readImportMaybe(
                    inputs: Parameters<TextParserForClosings>
                ) {
                    const content = readLayerContent(inputs)
                        .split(",")[0].trim();
                    return (
                        content[0] === "'"
                        && content.length > 2
                        && content[content.length - 1] === "'"
                    ) ? content.slice(1, -1) : undefined;
                }
            },
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