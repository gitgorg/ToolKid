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

        //TOP PRIORITY

        cdw_comment: {
            patterns: [["//", /\n|$/], ["/*", "*/"]],
            contains: ["cdw_comment"],
        },
        //texts
        cdw_text: {
            patterns: [["'", "'"]],
            contains: ["cdw_textEscape", "cdw_textParse"]
        },
        cdw_textEscape: {
            patterns: [/\\./],
            isROOTLayer: false
        },
        cdw_textParse: {
            patterns: [["{{", "}}"]],
            contains: ["ROOT"],
            isROOTLayer: false
        },

        //MEDIUM PRIORITY

        cdw_closure: {
            patterns: [["{{", "}}"]],
            contains: ["ROOT"]
        },
        cdw_newLine: {
            patterns: ["&&"]
        },
        //lists
        cdw_list: {
            patterns: [["[", "]"]],
            contains: ["cdw_listSeparator", "cdw_listAssignment", "ROOT"],
        },
        cdw_listSeparator: {
            patterns: [","],
            isROOTLayer: false,
        },
        cdw_listAssignment: {
            patterns: ["<<"],
            isROOTLayer: false,
        },
        //functions
        cdw_funkDeclare: {
            patterns: [["{:", ":}"]],
            contains: ["ROOT"]
        },
        cdw_funkCall: {
            patterns: [["(", ")"]],
            contains: ["ROOT"]
        },

        //LOW PRIORITY

        cdw_pathSeparator: {
            patterns: [/\./]
        },
        // basic values
        cdw_null: {
            patterns: ["null"]
        },
        cdw_true: {
            patterns: ["true"]
        },
        cdw_false: {
            patterns: ["false"]
        },
        cdw_number: {
            patterns: [/\d[\d_\.]*/]
        },
        cdw_variableDeclaration: {
            patterns: [/\$\$\w+/]
        },
        // operators
        cdw_plus: {
            patterns: ["+"]
        },
        cdw_minus: {
            patterns: ["-"]
        },
        cdw_star: {
            patterns: ["*"]
        },
        cdw_slash: {
            patterns: ["/"]
        },
        cdw_assignment: {
            patterns: ["<<"]
        },

        // file connections
        cdw_import: {
            patterns: [["#import(", ")"]],
            layerData: { fileConnection: "insert" },
        },
        cdw_importMaybe: {
            patterns: [["#load(", ")"]],
            contains: ["ROOT"],
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

        cdw_textFallback: {
            patterns: [/\w+/]
        }
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "CDW", entries: publicExports });
    }
})();