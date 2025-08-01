interface ToolKid_file { code: TK_Code_file }
interface TK_Code_file {
    HTML: {
        textLayerDefinition: TextLayerDefinition,
    }
}



(function TK_CodeHTML_init() {
    const CodeCDW = <TK_Code_file["CDW"]>require("./TK_CodeCDW.js");
    const CodeCSS = <TK_Code_file["CSS"]>require("./TK_CodeCSS.js");
    const { merge } = <TK_DataTypes_file["object"]>require("../dataTypes/TK_DataTypesObject.js");



    const publicExports = module.exports = {} as TK_Code_file["HTML"];
    const nonMainLayer = <any>{ isROOTLayer: false };
    publicExports.textLayerDefinition = merge(
        CodeCSS.textLayerDefinition,
        CodeCDW.textLayerDefinition,
        {
            html_comment: {
                patterns: [["<!--", "-->"]],
            },
            html_tagStart: {
                patterns: [[/<\w+/, ">"]],
                contains: [
                    "html_href", "html_src", "html_css",
                    "html_insert", "html_cdw",
                    "html_attribute",
                ]
            },

            html_href: {
                patterns: [["href=\"", "\""]],
                isROOTLayer: false,
                layerData: { fileConnection: "optional" },
            },
            html_src: {
                patterns: [["src=\"", "\""]],
                isROOTLayer: false,
                layerData: { fileConnection: "optional" },
            },
            html_insert: {
                patterns: [[/DATA-INSERT="/i, "\""]],
                isROOTLayer: false,
                layerData: { fileConnection: "insert" },
            },
            html_css: {
                isROOTLayer: false,
                patterns: [["style=\"", "\""]],
                contains: ["css_comment", "css_string", "css_url"]
            },
            html_cdw: {
                patterns: [[/DATA-MVC="/i, '"'], [/DATA-CDW="/i, '"']],
                isROOTLayer: false,
                contains: ["cdw_comment", "cdw_import", "cdw_importMaybe", "cdw_insertAfter"]
            },
            html_attribute: {
                isROOTLayer: false,
                patterns: [[/\S+="/, '"']]
            },

            css_comment: nonMainLayer,
            css_string: nonMainLayer,
            css_url: nonMainLayer,

            cdw_comment: nonMainLayer,
            cdw_import: nonMainLayer,
            cdw_importMaybe: nonMainLayer,
            cdw_insertAfter: nonMainLayer,

        }
    );



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "HTML", entries: publicExports });
    }
})();