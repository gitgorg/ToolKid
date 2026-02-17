interface ToolKid_file { code: TK_Code_file }
interface TK_Code_file {
    HTML: {
        collectAttributes(
            text: string,
        ): {
            attributes: Map<string, [
                valueStart: number,
                valueStop: number,
                text: string,
                isText: boolean,
            ]>,
            endPosition?: number,
            error?: Error
        },
        extendTag(inputs: {
            baseTag: string,
            extensionTag: string,
            indentBase?: string,
            indentExtension?: string,
        }): string[],
        textLayerDefinition: TextLayerDefinition,
    }
}



(function TK_CodeHTML_init() {
    const { addIndentation } = <TK_Code_file>require("./TK_CodeParsing.js");
    const CodeCDW = <TK_Code_file["CDW"]>require("./TK_CodeCDW.js");
    const CodeCSS = <TK_Code_file["CSS"]>require("./TK_CodeCSS.js");
    const { merge } = <TK_DataTypes_file["object"]>require("../dataTypes/TK_DataTypesObject.js");
    const { createTextParser } = <LibraryParsing_file>require("../core/LibraryParsing.js");



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
                    "html_insert", "html_extend", "html_cdw",
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
            html_extend: {
                patterns: [[/DATA-EXTEND="/i, "\""]],
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
                patterns: [
                    [/\S+="/, '"'],
                    [/\S+=/, /\s/],
                ]
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



    publicExports.collectAttributes = function TK_CodeHTML_collectAttributes(text) {
        const result = <ReturnType<TK_Code_file["HTML"]["collectAttributes"]>>{
            attributes: new Map(),
            endPosition: undefined,
            error: undefined,
        };
        result.error = <undefined>collectAttributesParser({
            text, result
        });
        return result;
    };

    let valueIsText = false;
    const collectAttributesParser = <TextParser>createTextParser({
        layerDefinition: {
            html_tagStart: {
                ...publicExports.textLayerDefinition.html_tagStart,
                contains: ["html_attribute"],
            },
            html_attribute: publicExports.textLayerDefinition.html_attribute,
        },
        parsers: new Map([
            [function TK_CodeHTML_collectAttributesParser(
                closing, layer, inputs, depth, opening
            ) {
                if (inputs.result.endPosition !== undefined) {
                    return;
                } else if (layer.name === "html_tagStart") {
                    inputs.result.endPosition = closing.index + closing[0].length;
                    return;
                }

                valueIsText = closing[0] === '"';
                inputs.result.attributes.set(
                    opening[0].slice(0,
                        valueIsText ? -2 : -1
                    ).toLocaleLowerCase(),
                    [
                        opening.index + opening[0].length,
                        closing.index,
                        inputs.text.slice(
                            opening.index + opening[0].length,
                            closing.index
                        ),
                        valueIsText
                    ]
                );
            }, ">*"]
        ])
    });
    if (collectAttributesParser instanceof Error) {
        throw [
            "TK_CodeHTML_init - failed to create collectAttribuesParser:",
            collectAttributesParser
        ]
    }

    publicExports.extendTag = function TK_CodeHTML_extendTag(inputs) {
        let collected = publicExports.collectAttributes(inputs.extensionTag);
        if (collected instanceof Error) {
            ToolKid.debug.terminal.logWarning("TK_CodeHTML_extendTag - DATA-EXTEND failed:", Error);
            return [inputs.baseTag];
        }

        const additions = collected.attributes;
        collected = publicExports.collectAttributes(inputs.baseTag);
        if (collected instanceof Error || collected.endPosition === undefined) {
            ToolKid.debug.terminal.logWarning("TK_CodeHTML_extendTag - DATA-EXTEND failed:", collected);
            return [inputs.baseTag];
        }

        const { baseTag } = inputs;
        const indentBase = inputs.indentBase || "";
        const parts = [];
        let position = 0;
        let newStartStop: any[] | undefined;
        for (const [key, [start, stop]] of collected.attributes) {
            newStartStop = additions.get(key);
            if (newStartStop === undefined) {
                continue;
            }

            parts.push(...addIndentation(
                baseTag.slice(position, start),
                indentBase
            ));
            parts.push(newStartStop[2], " ");
            parts.push(...addIndentation(
                baseTag.slice(start, stop),
                indentBase
            ));
            position = stop;
            additions.delete(key);
        }
        parts.push(...addIndentation(
            baseTag.slice(position, collected.endPosition - 1),
            indentBase
        ));
        for (const [key, [start, , content, isText]] of additions) {
            const tagStart = start - key.length - (isText ? 2 : 1);
            parts.push(" ", inputs.extensionTag.slice(tagStart, start), content, isText ? '"' : '');
        }
        parts.push(">");
        parts.push(...addIndentation(
            baseTag.slice(collected.endPosition),
            indentBase
        ));
        return parts;
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "HTML", entries: publicExports });
    }
})();