interface ToolKid_file { code: TK_Code_file }
interface TK_Code_file { HTML: TK_CodeHTML_file }
type TK_CodeHTML_file = {
    textLayerDefinition: TextLayerDefinition,
}



(function TK_CodeHTML_init() {
    const publicExports = module.exports = {} as TK_CodeJS_file;

    const { textLayerDefinition } = <ToolKid_file["code"]["CDW"]>require("./TK_CodeCDW.js");
    const { merge } = <ToolKid_file["dataTypes"]["object"]>require("../dataTypes/TK_DataTypesObject.js");


    publicExports.textLayerDefinition = {
        html_comment: {
            patterns: [["<!--", "-->"]],
        },
        html_href: {
            patterns: [["href=\"", "\""]],
        },
        html_src: {
            patterns: [["src=\"", "\""]],
        },
        html_insert: {
            patterns: [["DATA-INSERT=\"", "\""]],
        },

        // html_css: {
        //     patterns: [["style=\"", "\""]],
        //     contains: ["css_comment", "css_string", "css_url"]
        // },
        // css_comment: nonMainLayer,
        // css_string: nonMainLayer,
        // css_url: nonMainLayer,

        // html_cdw: {
        //     patterns: [["DATA-MVC=\"", "\""], ["DATA-CDW=\"", "\""]],
        //     contains: ["cdw_comment", "cdw_import", "cdw_importMaybe", "cdw_insertAfter"]
        // },
        // cdw_comment: nonMainLayer,
        // cdw_import: nonMainLayer,
        // cdw_importMaybe: nonMainLayer,
        // cdw_insertAfter: nonMainLayer,
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "HTML", entries: publicExports });
    }
})();