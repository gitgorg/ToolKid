interface ToolKid_file { code: TK_Code_file }
interface TK_Code_file { JS: TK_CodeJS_file }
type TK_CodeJS_file = {
    removeComments(
        code: string
    ): string[],
    replaceFileConnections(inputs: {
        text: string,
        replacer(code: string): string | void
    }): string[],

    textLayerDefinition: TextLayerDefinition,
}



(function TK_CodeJS_init() {
    const { readLayerContent } = ToolKid.getCoreModule("parsing");



    const publicExports = module.exports = {} as TK_CodeJS_file;
    const stringSignals = ['"', "'", "`"];
    const unconnectedFiles = new Set([
        "fs", "http", "module", "path", "stream"
    ]);

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
            isROOTLayer: false,
        },
        js_import: {
            patterns: [["require(", ")"]],
            layerData: {
                fileConnection: "preload",
                readLayerContent: function TK_CodeJS_readImport(
                    inputs: Parameters<TextParserForClosings>
                ) {
                    let content = publicExports.removeComments(readLayerContent(inputs))
                        .join("").split(",")[0].trim();
                    const signalID = stringSignals.indexOf(content[0]);
                    if (
                        signalID === -1
                        || content.length < 3
                        || content[content.length - 1] !== stringSignals[signalID]
                    ) {
                        return;
                    }
                    content = content.slice(1, -1);
                    return unconnectedFiles.has(content)
                        ? undefined : content;
                }
            },
        },
        js_bracket: {
            patterns: [["(", ")"], ["{", "}"]],
            contains: ["ROOT"],
        },
        js_RX: {
            patterns: [[/[=|:|\(]\s*\//, "/"]],
            contains: ["js_escape"]
        },
    };



    publicExports.removeComments = ToolKid.getCoreModule("parsing").createTextReplacer({
        layerDefinition: {
            js_comment: publicExports.textLayerDefinition.js_comment,
            js_text: publicExports.textLayerDefinition.js_text,
            js_escape: publicExports.textLayerDefinition.js_escape,
        },
        parseClosings: function (result, layerData): any {
            if (layerData.name === "js_comment") {
                return "";
            }
        }
    });
    Object.defineProperty(publicExports.removeComments, "name", {
        value: "TK_CodeJS_removeComments",
    });

    const validPathOpenings = new Set(['"', "'", "`"]);
    const validPathClosings = new Set([".js", "jsm"]);
    publicExports.replaceFileConnections = ToolKid.getCoreModule("parsing").createTextReplacer({
        layerDefinition: publicExports.textLayerDefinition,
        parseClosings: function TK_CodeJS_replaceFileConnections(
            ...inputs: Parameters<TextParserForClosings>
        ) {
            if (inputs[1].fileConnection === undefined) {
                return;
            }

            const content = publicExports.removeComments(
                readLayerContent(inputs)
            ).join("").trim();
            if (
                validPathOpenings.has(content[0])
                && validPathClosings.has(content.slice(-4, -1))
            ) {
                return inputs[2].replacer(content);
            }
        }
    });
    Object.defineProperty(publicExports.replaceFileConnections, "name", {
        value: "TK_CodeJS_replaceFileConnections",
    });



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "JS", entries: publicExports });
    }
})();