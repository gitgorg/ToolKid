(function TK_CodeCDW_test() {
    const { assert, test } = ToolKid.debug.test;
    const { textLayerDefinition } = ToolKid.code.CDW;
    const { createTextParser } = ToolKid.getCoreModule("parsing");



    const { readLayerContent } = <any>textLayerDefinition.cdw_importMaybe.layerData;
    test({
        subject: readLayerContent,
        execute: function readingContents() {
            const contents = <string[]>[];
            const parser = <TextParser>createTextParser({
                layerDefinition: {
                    cdw_importMaybe: textLayerDefinition.cdw_importMaybe
                },
                parsers: new Map([
                    [function () {
                        contents.push(readLayerContent(arguments))
                    }, ">*"]
                ])
            });
            parser("\
a #load('b.cdw') c #load(d.js) e #load('f.css', '.test.value')\
g #load() h #load('') i #load($variable)");
            assert({
                "multiple contents": {
                    value: contents,
                    shouldBe: ["b.cdw", , "f.css", , ,]
                }
            });
        }
    });

    test({
        subject: createTextParser,
        execute: function parsingCDWText() {
            const parser = <TextParser>createTextParser({
                // debug: true,
                layerDefinition: textLayerDefinition,
                parsers: new Map([
                    [<TextParserForOpenings>function (opening, layerData, inputs, depth) {
                        contents.push([
                            opening.index,
                            layerData.name,
                        ])
                    }, "<*"],
                    <any>["REMOVE", "cdw_newLine"]
                ])
            });
            if (parser instanceof Error) {
                throw parser;
            }

            const contents = <any[]>[];
            parser("'single\\' double\\2'");
            assert({
                "quotes": {
                    value: contents,
                    shouldBe: [
                        [0, 'cdw_text'],
                        [7, 'cdw_textEscape'],
                        [16, 'cdw_textEscape']
                    ],
                    toleranceDepth: 3
                }
            });

            contents.length = 0;
            parser("'number{{2+3}} and text \\{{4+5}}'");
            assert({
                "quotes2": {
                    value: contents,
                    shouldBe: [
                        [0, 'cdw_text'],
                        [7, 'cdw_textParse'],
                        [9, 'cdw_number'],
                        [10, 'cdw_plus'],
                        [11, 'cdw_number'],
                        [24, 'cdw_textEscape']
                    ],
                    toleranceDepth: 3
                }
            });

            contents.length = 0;
            parser(`
&& #info() | watch:[[keyDown, Alt, c],[keyDown, Alt, 'ç']]
&& #load([
    path << 'state.js',
    callback << {:
        && .match.loadState($)
    :}
])`
            );
            assert({
                "real code": {
                    value: contents,
                    shouldBe: [
                        [5, 'cdw_textFallback'],
                        [9, 'cdw_funkCall'],
                        [14, 'cdw_textFallback'],
                        [20, 'cdw_list'],
                        [21, 'cdw_list'],
                        [22, 'cdw_textFallback'],
                        [29, 'cdw_listSeparator'],
                        [31, 'cdw_textFallback'],
                        [34, 'cdw_listSeparator'],
                        [36, 'cdw_textFallback'],
                        [38, 'cdw_listSeparator'],
                        [39, 'cdw_list'],
                        [40, 'cdw_textFallback'],
                        [47, 'cdw_listSeparator'],
                        [49, 'cdw_textFallback'],
                        [52, 'cdw_listSeparator'],
                        [54, 'cdw_text'],
                        [63, 'cdw_importMaybe'],
                        [69, 'cdw_list'],
                        [75, 'cdw_textFallback'],
                        [80, 'cdw_listAssignment'],
                        [83, 'cdw_text'],
                        [93, 'cdw_listSeparator'],
                        [99, 'cdw_textFallback'],
                        [108, 'cdw_listAssignment'],
                        [111, 'cdw_funkDeclare'],
                        [125, 'cdw_pathSeparator'],
                        [126, 'cdw_textFallback'],
                        [131, 'cdw_pathSeparator'],
                        [132, 'cdw_textFallback'],
                        [141, 'cdw_funkCall']
                    ],
                    toleranceDepth: 3,
                },
            });
        }
    });
})();