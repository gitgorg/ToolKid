interface ToolKid_file { code: TK_Code_file }
interface TK_Code_file { JS: TK_CodeJS_file }
type TK_CodeJS_file = {
    readFileConnections(
        code: string,
    ): FileConnectionEntry[],
    removeComments(
        code: string
    ): string,
    replaceFileConnections(inputs: {
        text: string,
        replacer(code: string): string | void
    }): string,

    textLayerDefinition: TextLayerDefinition,
}



type FileConnectionEntry = [
    name: string, priority: "inserts" | "maybe" | "needed", FileConnectionIndexes
]
type FileConnectionIndexes = [
    openingStart: number, openingEnd: number,
    closingStart: number, closingEnd: number,
]



(function TK_CodeJS_init() {
    const { readLayerContent } = ToolKid.getCoreModule("parsing");



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
            isROOTLayer: false,
        },
        js_import: {
            patterns: [["require(", ")"]],
            layerData: { fileConnection: "preload" },
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



    const parseFileConnections = ToolKid.getCoreModule("parsing").createTextParser({
        layerDefinition: publicExports.textLayerDefinition,
        parseClosings: function RS_connections_parseLayerJS(
            ...inputs: Parameters<TextParserForClosings>
        ) {
            if (inputs[1].fileConnection === undefined) {
                return;
            }

            let content = readLayerContent(inputs);
            content = publicExports.removeComments(content).trim();
            if (
                !validPathOpenings.has(content[0])
                || !validPathClosings.has(content.slice(-4, -1))
            ) {
                return;
            }

            const closing = inputs[0];
            const opening = inputs[4];
            inputs[2].result.push([
                content.slice(1, -1),
                inputs[1].fileConnection,
                [
                    opening.index, opening.index + opening[0].length,
                    closing.index, closing.index + closing[0].length,
                ]
            ]);
        }
    });

    publicExports.readFileConnections = function TK_CodeJS_readFileConnections(text) {
        const result = <FileConnectionEntry[]>[];
        parseFileConnections({ text, result });
        return result;
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
            ).trim();
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