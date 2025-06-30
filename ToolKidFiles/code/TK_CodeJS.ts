interface ToolKid_file { code: TK_Code_file }
interface TK_Code_file { JS: TK_CodeJS_file }
interface TK_CodeJS_file {
    textLayerDefinition: TextLayerDefinition,
}



(function TK_CodeJS_init() {
    const publicExports = module.exports = {} as TK_CodeJS_file;

    publicExports.textLayerDefinition = {
        js_comment: {
            patterns: [["//", /\n|$/], ["/*", "*/"]],
        },
        js_text: {
            patterns: [["\"", "\""], ["'", "'"], ["`", "`"]],
            contains: ["js_escape"],
        },
        js_escape: {
            patterns: [/\\./s],
            isMAINLayer: false,
        },
        js_import: {
            patterns: [["re" + "quire(", ")"]],
        },
        js_bracket: {
            patterns: [["(", ")"], ["{", "}"]],
            contains: ["MAIN"],
        },
        js_RX: {
            patterns: [[/[=|:|\(]\s*\//, "/"]],
            contains: ["js_escape"]
        },
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "JS", entries: publicExports });
    }
})();