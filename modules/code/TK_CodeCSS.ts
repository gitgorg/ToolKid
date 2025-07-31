interface ToolKid_file { code: TK_Code_file }
interface TK_Code_file {
    CSS: {
        textLayerDefinition: TextLayerDefinition,
    }
}



(function TK_CodeCSS_init() {
    const { readLayerContent } = ToolKid.getCoreModule("parsing");



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
            layerData: {
                fileConnection: "optional",
                readLayerContent: function TK_CodeCSS_readURL(
                    inputs: Parameters<TextParserForClosings>
                ) {
                    const content = readLayerContent(inputs).trim();
                    if (content[0] === "'" && content.length > 2) {
                        return content.slice(1, -1);
                    } else {
                        return content.length > 1 ? content : undefined;
                    }
                }
            }
        },
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "CSS", entries: publicExports });
    }
})();