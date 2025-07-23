interface ToolKid_file { code: TK_Code_file }
interface TK_Code_file {
    CSS: {
        textLayerDefinition: TextLayerDefinition,
    }
}



(function TK_CodeCSS_init() {
    const publicExports = module.exports = {} as TK_CodeJS_file;

    publicExports.textLayerDefinition = {
        css_comment: {
            patterns: [["/*", "*/"]]
        },
        css_string: {
            patterns: [["\"", "\""], ["'", "'"]]
        },
        css_url: {
            patterns: [["url(", ")"]],
            layerData: { fileConnection: "optional" }
        },
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "CSS", entries: publicExports });
    }
})();